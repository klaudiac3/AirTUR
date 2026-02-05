import { google } from 'googleapis';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';
import querystring from 'querystring';
// Importujemy logikę jako moduł (zwróć uwagę na .js na końcu)
import { getDynamicReportContent } from '../../src/scripts/raport_logic.js';

export const handler = async (event) => {
  // 0. Walidacja metody HTTP
  if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
  }

  // 1. PARSOWANIE DANYCH
  let data;
  try {
      data = JSON.parse(event.body);
  } catch (e) {
      data = querystring.parse(event.body);
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  
  // Logika biznesowa
  const dynamicContent = getDynamicReportContent(data);

  // 2. PRZETWARZANIE PDF
  let attachments = [];
  let pdfStatus = 'BRAK';

  if (data.pdf_base64) {
      try {
          const base64Data = data.pdf_base64.split('base64,').pop();
          const pdfBuffer = Buffer.from(base64Data, 'base64');
          
          attachments.push({
              filename: `Raport_AirTUR_${dynamicContent.reportId}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
          });
          pdfStatus = 'WYGENEROWANO';
      } catch (pdfError) {
          console.error("Błąd przetwarzania PDF:", pdfError);
          pdfStatus = 'BŁĄD_DANYCH';
      }
  }

  let googleSheetStatus = 'PENDING';
  let emailStatus = 'PENDING';
  let logs = [];

  // 3. OPERACJA A: ZAPIS DO GOOGLE SHEETS
  try {
    const auth = new google.auth.JWT(
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        null,
        process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        ['https://www.googleapis.com/auth/spreadsheets']
    );
    const sheets = google.sheets({ version: 'v4', auth });
    
    await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'A:AD',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[
                new Date().toLocaleString('pl-PL'),                 
                data.source || 'nieznane',                          
                data.cel || 'kontakt',                              
                data.imie || '-',                                   
                data.email || '-',                                  
                data.telefon || '-',                                
                data.wiadomosc || '-',                              
                data.zgoda || 'TAK',                                
                data.wynik_typ_budynku || '-',                      
                data.wynik_slonce || '-',                           
                data.wynik_ludzie || '-',                           
                data.wynik_paliwo || '-',                           
                data.wynik_rachunek || '-',                         
                data.wynik_komfort || '-',                          
                data.wynik_metraz || '-',                           
                data.wynik_moc || '-',                              
                data.wynik_cel || '-',                              
                data.wynik_oszczednosci || '-',                     
                data.wynik_model || '-',                            
                dynamicContent.expertExplanation || '-',            
                data.wynik_metraz || '-',                           
                data.wynik_moc || '-',                              
                data.wynik_cel || '-',                              
                data.wynik_oszczednosci || '-',                     
                data.wynik_model || '-',                            
                new Date().toISOString(),                           
                'PENDING',                                          
                pdfStatus,                                          
                pdfStatus === 'WYGENEROWANO' ? `Raport_${dynamicContent.reportId}.pdf` : '-', 
                'new'                                               
            ]]
        }
    });
    googleSheetStatus = 'SUCCESS';
  } catch (sheetErr) {
    console.error("Google Sheets Error:", sheetErr);
    googleSheetStatus = 'FAILED';
    logs.push(`Sheets error: ${sheetErr.message}`);
  }

  // 4. OPERACJA B: WYSYŁKA EMAIL
  try {
    // Odczyt szablonu (musimy użyć process.cwd() w środowisku Serverless)
    const templatePath = path.resolve(process.cwd(), 'src/templates/report-template.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    
    const finalHtml = htmlTemplate
        .replace(/{{reportId}}/g, dynamicContent.reportId)
        .replace(/{{name}}/g, data.imie || 'Kliencie')
        .replace(/{{goalLabel}}/g, dynamicContent.goalLabel)
        .replace(/{{buildingType}}/g, dynamicContent.buildingType)
        .replace(/{{area}}/g, data.wynik_metraz || '---')
        .replace(/{{sunFactorLabel}}/g, dynamicContent.sunFactorLabel)
        .replace(/{{peopleCount}}/g, data.wynik_ludzie || 'Standard')
        .replace(/{{currentHeatSource}}/g, data.wynik_paliwo || "Nieznane") 
        .replace(/{{calculatedPower}}/g, data.wynik_moc || dynamicContent.modelPower)
        .replace(/{{modelName}}/g, data.wynik_model || 'Model Premium')
        .replace(/{{modelPower}}/g, dynamicContent.modelPower) 
        .replace(/{{expertExplanation}}/g, dynamicContent.expertExplanation)
        .replace(/{{rejectedPowerClass}}/g, dynamicContent.rejectedPowerClass)
        .replace(/{{savingsYear}}/g, data.wynik_oszczednosci || '---')
        .replace(/{{savings5Years}}/g, dynamicContent.savings5Years)
        .replace(/{{savings10Years}}/g, dynamicContent.savings10Years)
        .replace(/{{expertTipDynamic}}/g, dynamicContent.expertTipDynamic)
        .replace(/{{date}}/g, dynamicContent.date);

    await resend.emails.send({
        from: 'AirTUR <kontakt@airtur.pl>',
        to: [data.email],
        bcc: 'kontakt@airtur.pl',
        subject: `Twoja Osobista Karta Diagnostyczna AirTUR (ID: ${dynamicContent.reportId})`,
        html: finalHtml,
        attachments: attachments
    });
    emailStatus = 'SUCCESS';

  } catch (emailErr) {
    console.error("Email Error:", emailErr);
    emailStatus = 'FAILED';
    logs.push(`Email error: ${emailErr.message}`);
  }

  if (googleSheetStatus === 'FAILED' && emailStatus === 'FAILED') {
      return {
          statusCode: 500,
          body: JSON.stringify({ error: "Critical failure.", details: logs })
      };
  }

  return {
      statusCode: 200,
      body: JSON.stringify({ 
          message: "Process completed", 
          sheets: googleSheetStatus, 
          email: emailStatus 
      })
  };
};