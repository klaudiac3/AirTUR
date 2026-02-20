export const ALL = ({ request }) => {
  console.log("🔥🔥🔥 TESTOWE API ZOSTAŁO WYWOŁANE! 🔥🔥🔥");
  return new Response(JSON.stringify({ message: "API ZYJE" }), { status: 200 });
};