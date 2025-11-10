const axios = require("axios");
const { transaction } = require("../data.js");

const client_id = "1000.PI3NXZ2NN5UYD4CE322QPS9W609HLF";
const client_secret = "c026be16a48706543ddc4d2a89ba9363a6750045eb";
const refresh_token = "1000.97d12fd8612cbfa69604216ef6d779ae.6b7881398e3c60adc1ba65e4691b5977";
const zoho_domain = "https://accounts.zoho.com";
const crm_domain = "https://www.zohoapis.com";
const transactionsModule = "Transactions";

async function getAccessToken() {
  const response = await axios.post(`${zoho_domain}/oauth/v2/token`, null, {
    params: {
      refresh_token,
      client_id,
      client_secret,
      grant_type: "refresh_token",
    },
  });
  console.log("✅ Access Token Generated");
  return response.data.access_token;
}

function sanitizeTransaction(trx) {
  const baseTransactionRecord = {
    Layout: trx.Layout_id ? { id: trx.Layout_id } : undefined,
    Name: trx.Transaction_Name,
    Transaction_Name: trx.Transaction_Name,
    Customer_interest: trx.Customer_interest,
    Prefix_Code: trx.Prefix_Code,
    Stone_Weight: trx.Stone_Weight,
    Making: trx.Making,
    Making_Price_1: trx.Making_Price_1,
    Making_Price_2: trx.Making_Price_2,
    Making_Price_3: trx.Making_Price_3,
    Category: trx.Category,
    Sub_Category: trx.Sub_Category,
    Style: trx.Style,
    Design: trx.Design,
    Brand: trx.Brand,
    Purity: trx.Purity,
    Metal_Colour: trx.Metal_Colour,
    Metal_Carat: trx.Metal_Carat,
    Metal_Rate_pure: trx.Metal_Rate_pure,
    Metal_Value: trx.Metal_Value,
    Gross_Weight: trx.Gross_Weight,
    Net_Weight: trx.Net_Weight,
    Stone_Rate: trx.Stone_Rate,
    Deal_Name: trx.Deal_Id ? { id: trx.Deal_Id } : undefined,
    Currency_Symbol: trx.Currency_Symbol,
    Description: trx.Description,
  };

  return Object.fromEntries(
    Object.entries(baseTransactionRecord).filter(([, value]) => value !== null && value !== undefined && value !== "")
  );
}

async function createTransaction(access_token, trx) {
  const payload = {
    data: [sanitizeTransaction(trx)],
  };

  console.log("📦 Creating Transaction Payload:", JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(`${crm_domain}/crm/v8/${transactionsModule}`, payload, {
      headers: {
        Authorization: `Zoho-oauthtoken ${access_token}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`✅ Transaction Created: ${trx.Transaction_Name}`);
    return response.data.data[0];
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error("❌ Error creating transaction:", JSON.stringify(errorDetails, null, 2));
    return {
      success: false,
      message: error.response?.data?.message || error.message,
      details: errorDetails,
    };
  }
}

async function run() {
  try {
    const access_token = await getAccessToken();
    const results = [];

    for (const trx of transaction.transactions) {
      const result = await createTransaction(access_token, trx);
      results.push(result);
    }

    console.log("🎉 All transactions processed successfully!");
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error("❌ Failed to process transactions:", error.message);
  }
}

run();

