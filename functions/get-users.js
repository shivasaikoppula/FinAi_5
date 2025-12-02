// functions/get-users.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/users?select=*`, {
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`
      }
    });
    const data = await res.json();
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
      },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
