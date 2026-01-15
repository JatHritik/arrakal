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
    Name: trx.Name || trx.Transaction_Name || "Untitled",
    Customer_interest: trx.Customer_interest,
    Customer_Contact_Number: trx.Customer_Contact_Number,
    Country: trx.Country,
    Religion: trx.Religion,
    Prefix_Code: trx.Prefix_Code,
    Size: trx.Size,
    Stone_Weight: trx.Stone_Weight,
    Stone_Type: trx.Stone_Type,
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
    Metal_WT: trx.Metal_WT,
    Gross_Weight: trx.Gross_Weight,
    Net_Weight: trx.Net_Weight,
    Stone_Rate: trx.Stone_Rate,
    Stone_Value: trx.Stone_Value,
    Stone_Selling_Rate_Per_Carat: trx.Stone_Selling_Rate_Per_Carat,
    Stone_Selling_Value: trx.Stone_Selling_Value,
    Diamond_Selling_Rate: trx.Diamond_Selling_Rate,
    Diamond_Selling_Value: trx.Diamond_Selling_Value,
    Diamond_Amount_Per_CT: trx.Diamond_Amount_Per_CT,
    DIA_Carat_Weight: trx.DIA_Carat_Weight,
    Diamond_Size: trx.Diamond_Size,
    Diamond_Clarity: trx.Diamond_Clarity,
    No_of_Diamonds: trx.No_of_Diamonds,
    Wastage: trx.Wastage,
    Labour_Charges: trx.Labour_Charges,
    Polishing_Charges: trx.Polishing_Charges,
    Setting_Charges: trx.Setting_Charges,
    Misc_Charges: trx.Misc_Charges,
    Rhodium_Charges: trx.Rhodium_Charges,
    Cost: trx.Cost,
    Cost_Code: trx.Cost_Code,
    Price_Code: trx.Price_Code,
    Tag_Price_1: trx.Tag_Price_1,
    Tag_Price_2: trx.Tag_Price_2,
    Tag_Price_3: trx.Tag_Price_3,
    Tag_line_1: trx.Tag_line_1,
    Tag_line_2: trx.Tag_line_2,
    Tag_line_3: trx.Tag_line_3,
    Tag_line_4: trx.Tag_line_4,
    Tag_line_5: trx.Tag_line_5,
    Supplier_Name: trx.Supplier_Name,
    Supplier_Purchase_Number: trx.Supplier_Purchase_Number,
    Supplier_Ref: trx.Supplier_Ref,
    Stock_Code: trx.Stock_Code,
    Main_Stock_Code: trx.Main_Stock_Code,
    Metal_Division: trx.Metal_Division,
    Item_Division: trx.Item_Division,
    Diamond_Division: trx.Diamond_Division,
    Type: trx.Type,
    Quantity: trx.Quantity,
    PCS: trx.PCS,
    Design_Number: trx.Design_Number,
    Certificate_Number: trx.Certificate_Number,
    Country: trx.Country,
    Deals: trx.Deals ? { id: trx.Deals.id } : undefined,
    Description: trx.Description || "Transaction created from API",
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

    for (const trx of transaction.data) {
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

