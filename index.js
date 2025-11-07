const express = require("express");
const { data } = require("./data.js"); // Import data from data.js
const axios = require("axios");
const app = express();
const port = 3000;

// ------------------- ZOHO CONFIG -------------------
const client_id = "1000.PI3NXZ2NN5UYD4CE322QPS9W609HLF";
const client_secret = "c026be16a48706543ddc4d2a89ba9363a6750045eb";
const refresh_token = "1000.97d12fd8612cbfa69604216ef6d779ae.6b7881398e3c60adc1ba65e4691b5977";
const zoho_domain = "https://accounts.zoho.com";
const crm_domain = "https://www.zohoapis.com";
const moduleName = "Deals";


// ------------------- ACCESS TOKEN -------------------
async function getAccessToken() {
  try {
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
  } catch (error ) {
    console.error("❌ Error generating access token:", error.response?.data || error.message);
  }
}

// ------------------- CREATE A Single DEAL -------------------
async function createDeal(access_token, deal) {
  try {
    const dealData = {
      data: [
        {
          Deal_Name: deal.Deal_Name,
          Stage: deal.Stage,
          Amount: deal.Amount,
          Pipeline: deal.Pipeline || "ARG",
          Account_Name: {id: "6946766000000591172" }|| { id: deal.Account_Id },
          Contact_Name: {id:"6946766000000643083"}||{ id: deal.Contact_Id }, 
          Email: deal.Email,
          Phone: deal.Phone,
          Description: deal.Description,
          Customer_interest: deal.Customer_interest,
          Initial_Interest: deal.Initial_Interest,
          Category: deal.Category,
          Sub_Category: deal.Sub_Category,
          Brand: deal.Brand,
          Style: deal.Style,
          Size: deal.Size,
          Design: deal.Design,
          Prefix_Code: deal.Prefix_Code,
          Main_Stock_Code: deal.Main_Stock_Code,
          Stock_Code: deal.Stock_Code,
          Price_Code: deal.Price_Code,
          Purity: deal.Purity,
          Metal_Colour: deal.Metal_Colour,
          Gross_Weight: deal.Gross_Weight,
          Net_Weight: deal.Net_Weight,
          Stone_Weight: deal.Stone_Weight,
          Stone_Rate: deal.Stone_Rate,
          PCS: deal.PCS,
          Making: deal.Making,
          Making_Price_1: deal.Making_Price_1,
          Making_Price_2: deal.Making_Price_2,
          Making_Price_3: deal.Making_Price_3,
          Wastage: deal.Wastage,
          Supplier_Name: deal.Supplier_Name,
          Supplier_Purchase_Number: deal.Supplier_Purchase_Number,
        },
      ],
    };

    console.log("📦 Creating Deal:", dealData);
    const response = await axios.post(`${crm_domain}/crm/v8/${moduleName}`, dealData, {
      headers: {
        Authorization: `Zoho-oauthtoken ${access_token}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`✅ Deal Created: ${deal.Deal_Name}`, response.data.data[0]);
    return response.data.data[0];
  } catch (error) {
    const errorJson = {
      success: false,
      dealName: deal.Deal_Name,
      status: error.response?.status || "N/A",
      message: error.response?.data?.message || error.message,
      details: error.response?.data || null,
    };

    console.error("❌ Error creating deal:", JSON.stringify(errorJson, null, 2));
    return errorJson;
  }
}

// ------------------- CREATE ALL DEALS -------------------
async function createAllDeals() {
  const access_token = await getAccessToken();
  if (!access_token) {
    console.error("❌ Cannot proceed without access token.");
    return { success: false, message: "No access token" };
  }

  const results = [];
  for (const deal of data.deals) {
    const result = await createDeal(access_token, deal);
    results.push(result);
  }

  console.log("🎉 All deals processed successfully!");
  return results;
}

// ------------------- ROUTES -------------------

// Default route
app.get("/", (req, res) => {
  res.send("✅ Zoho CRM Deal Creator API is Running...");
});

// Route to trigger deal creation
app.post("/create-deals", async (req, res) => {
  try {
    const results = await createAllDeals();
    res.status(200).json({
      success: true,
      message: "Deals processed successfully",
      results,
    });
  } catch (error) {
    console.error("❌ Error in /create-deals route:", error.message);
    res.status(500).json({
      success: false,
      message: "Error creating deals",
      error: error.message,
    });
  }
});

// transaction work 










// ------------------- START SERVER -------------------
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
