const express = require("express");
const { data, transaction } = require("./data.js");
const axios = require("axios");
const app = express();
const port = 3000;

// ------------------- ZOHO CONFIG -------------------
const client_id = "1000.PI3NXZ2NN5UYD4CE322QPS9W609HLF";
const client_secret = "c026be16a48706543ddc4d2a89ba9363a6750045eb";
const refresh_token = "1000.97d12fd8612cbfa69604216ef6d779ae.6b7881398e3c60adc1ba65e4691b5977";
const zoho_domain = "https://accounts.zoho.com";
const crm_domain = "https://www.zohoapis.com";
const transactionsModule = "Transactions";
const dealsModule = "Deals";

// ------------------- ACCESS TOKEN -------------------
async function getAccessToken() {
  try {
    const res = await axios.post(`${zoho_domain}/oauth/v2/token`, null, {
      params: {
        refresh_token,
        client_id,
        client_secret,
        grant_type: "refresh_token",
      },
    });
    console.log("✅ Access Token Generated");
    return res.data.access_token;
  } catch (err) {
    console.error("❌ Error generating token:", err.response?.data || err.message);
  }
}

// ------------------- UTIL: TODAY -------------------
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

// ------------------- SEARCH DEAL BY PREFIX CODE -------------------
async function searchDealByPrefix(access_token, prefixCode) {
  try {
    const query = encodeURIComponent(`(Prefix_Code:equals:${prefixCode})`);
    const res = await axios.get(
      `${crm_domain}/crm/v6/${dealsModule}?criteria=${query}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${access_token}`,
        },
      }
    );

    if (res.data.data && res.data.data.length > 0) {
      console.log(`✅ Deal Found with Prefix_Code: ${prefixCode} (ID: ${res.data.data[0].id})`);
      return res.data.data[0].id;
    }
    console.log(`⚠️ No Deal found with Prefix_Code: ${prefixCode}`);
    return null;
  } catch (err) {
    console.error("❌ Deal Search Error:", err.message);
    return null;
  }
}

// ------------------- UPDATE DEAL -------------------
async function updateDeal(access_token, dealId, dealDataFromTemplate) {
  const dealObject = {
    Deal_Name: dealDataFromTemplate.Deal_Name || dealDataFromTemplate.Name || "Unnamed Deal",
    Stage: dealDataFromTemplate.Stage || "Closed Won",
    Closing_Date: dealDataFromTemplate.Closing_Date || today(),
    Amount: dealDataFromTemplate.Amount || 0,
    Customer_interest: dealDataFromTemplate.Customer_interest,
    Prefix_Code: dealDataFromTemplate.Prefix_Code,
    Description: dealDataFromTemplate.Description || "Auto-updated from Transaction",
    Account_Name: dealDataFromTemplate.Account_Id,
    Contact_Name: dealDataFromTemplate.Contact_Id,
    Email: dealDataFromTemplate.Email,
    Pipeline: dealDataFromTemplate.Pipeline || "ARG",
    Phone: dealDataFromTemplate.Phone,
    Category: dealDataFromTemplate.Category,
    Sub_Category: dealDataFromTemplate.Sub_Category,
    Brand: dealDataFromTemplate.Brand,
    Style: dealDataFromTemplate.Style,
    Size: dealDataFromTemplate.Size,
    Design: dealDataFromTemplate.Design,
    Purity: dealDataFromTemplate.Purity,
    Metal_Colour: dealDataFromTemplate.Metal_Colour,
    Gross_Weight: dealDataFromTemplate.Gross_Weight,
    Net_Weight: dealDataFromTemplate.Net_Weight,
    Stone_Weight: dealDataFromTemplate.Stone_Weight,
    Stone_Rate: dealDataFromTemplate.Stone_Rate,
    Making: dealDataFromTemplate.Making,
    Wastage: dealDataFromTemplate.Wastage,
    Supplier_Name: dealDataFromTemplate.Supplier_Name,
    Supplier_Purchase_Number: dealDataFromTemplate.Supplier_Purchase_Number,
  };

  // Remove undefined fields
  Object.keys(dealObject).forEach(key => 
    dealObject[key] === undefined && delete dealObject[key]
  );

  const dealData = { data: [dealObject] };

  try {
    console.log("📝 Updating Deal:", JSON.stringify(dealData, null, 2));
    await axios.put(`${crm_domain}/crm/v6/${dealsModule}/${dealId}`, dealData, {
      headers: {
        Authorization: `Zoho-oauthtoken ${access_token}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`✏️ Deal Updated (${dealId})`);
    return dealId;
  } catch (err) {
    console.error("❌ Deal Update Error:", JSON.stringify(err.response?.data) || err.message);
    return null;
  }
}

// ------------------- CREATE DEAL -------------------
async function createDeal(access_token, dealDataFromTemplate) {
  const dealObject = {
    Deal_Name: dealDataFromTemplate.Deal_Name || dealDataFromTemplate.Name || "Unnamed Deal",
    Stage: dealDataFromTemplate.Stage || "Closed Won",
    Closing_Date: dealDataFromTemplate.Closing_Date || today(),
    Amount: dealDataFromTemplate.Amount || 0,
    Customer_interest: dealDataFromTemplate.Customer_interest,
    Prefix_Code: dealDataFromTemplate.Prefix_Code,
    Description: dealDataFromTemplate.Description || "Auto-created from Transaction",
    Account_Name: dealDataFromTemplate.Account_Id,
    Contact_Name: dealDataFromTemplate.Contact_Id,
    Email: dealDataFromTemplate.Email,
    Pipeline: dealDataFromTemplate.Pipeline || "ARG",
    Phone: dealDataFromTemplate.Phone,
    Category: dealDataFromTemplate.Category,
    Sub_Category: dealDataFromTemplate.Sub_Category,
    Brand: dealDataFromTemplate.Brand,
    Style: dealDataFromTemplate.Style,
    Size: dealDataFromTemplate.Size,
    Design: dealDataFromTemplate.Design,
    Purity: dealDataFromTemplate.Purity,
    Metal_Colour: dealDataFromTemplate.Metal_Colour,
    Gross_Weight: dealDataFromTemplate.Gross_Weight,
    Net_Weight: dealDataFromTemplate.Net_Weight,
    Stone_Weight: dealDataFromTemplate.Stone_Weight,
    Stone_Rate: dealDataFromTemplate.Stone_Rate,
    Making: dealDataFromTemplate.Making,
    Wastage: dealDataFromTemplate.Wastage,
    Supplier_Name: dealDataFromTemplate.Supplier_Name,
    Supplier_Purchase_Number: dealDataFromTemplate.Supplier_Purchase_Number,
  };

  // Remove undefined fields
  Object.keys(dealObject).forEach(key => 
    dealObject[key] === undefined && delete dealObject[key]
  );

  const dealData = { data: [dealObject] };

  try {
    console.log("📦 Creating Deal:", JSON.stringify(dealData, null, 2));
    const res = await axios.post(`${crm_domain}/crm/v6/${dealsModule}`, dealData, {
      headers: {
        Authorization: `Zoho-oauthtoken ${access_token}`,
        "Content-Type": "application/json",
      },
    });

    const newDealId = res?.data?.data?.[0]?.details?.id;
    console.log(`🆕 Deal Created (${newDealId})`);
    return newDealId;
  } catch (err) {
    console.error("❌ Deal Create Error:", JSON.stringify(err.response.data) || err.message);
    return null;
  }
}

// ------------------- UPDATE TRANSACTION WITH DEAL -------------------
async function updateTransactionWithDeal(access_token, transactionId, dealId) {
  try {
    const body = { data: [{ Deals: { id: dealId } }] };
    await axios.put(`${crm_domain}/crm/v6/${transactionsModule}/${transactionId}`, body, {
      headers: {
        Authorization: `Zoho-oauthtoken ${access_token}`,
        "Content-Type": "application/json",
      },
    });
    console.log(`🔁 Linked Transaction (${transactionId}) → Deal (${dealId})`);
  } catch (err) {
    console.error("❌ Error updating transaction:", err.response?.data || err.message);
  }
}

// ------------------- CREATE TRANSACTION -------------------
async function createTransaction(access_token, trx) {
  try {
    const safeName = trx.Name?.trim() || "Untitled Transaction";
    
    // Build payload with ALL fields from the incoming request
    const transactionData = {
      Name: safeName,
      Layout: trx.Layout_id ? { id: trx.Layout_id } : undefined,
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
      Description: trx.Description || "Transaction created from API",
      Deals: trx.Deals,
    };

    // Remove undefined fields
    Object.keys(transactionData).forEach(key => 
      transactionData[key] === undefined && delete transactionData[key]
    );

    const transactionPayload = { data: [transactionData] };

    console.log("📦 Creating Transaction:", JSON.stringify(transactionPayload, null, 2));
    const res = await axios.post(`${crm_domain}/crm/v6/${transactionsModule}`, transactionPayload, {
      headers: {
        Authorization: `Zoho-oauthtoken ${access_token}`,
        "Content-Type": "application/json",
      },
    });

    const transactionId = res.data.data[0].details.id;
    console.log(`✅ Transaction Created (${transactionId})`);

    // 🔍 Step 2: Search for existing Deal by Prefix_Code
    let dealId = null;
    if (trx.Prefix_Code) {
      dealId = await searchDealByPrefix(access_token, trx.Prefix_Code);
    }

    // 🔄 Step 3: If Deal exists, Update it; Otherwise Create new Deal
    if (dealId) {
      dealId = await updateDeal(access_token, dealId, trx);
      if (dealId) {
        await updateTransactionWithDeal(access_token, transactionId, dealId);
        return { transactionId, dealId, status: "deal_updated_and_linked" };
      }
    } else {
      dealId = await createDeal(access_token, trx);
      if (dealId) {
        await updateTransactionWithDeal(access_token, transactionId, dealId);
        return { transactionId, dealId, status: "deal_created_and_linked" };
      } else {
        console.warn("⚠️ Deal creation failed, skipping link update.");
        return { transactionId, dealId: null, status: "deal_creation_failed" };
      }
    }

    return { transactionId, dealId: null, status: "deal_error" };
  } catch (err) {
    console.error("❌ Transaction Error:", err.response?.data || err.message);
    return null;
  }
}

// ------------------- CREATE ALL TRANSACTIONS -------------------
async function createAllTransactions() {
  const token = await getAccessToken();
  if (!token) return { success: false, message: "No access token" };

  const results = [];
  for (const trx of transaction.data) {
    const result = await createTransaction(token, trx);
    results.push(result);
  }

  console.log("🎉 All transactions processed!");
  return results;
}

// ------------------- ROUTES -------------------
app.use(express.json()); // Add this to parse JSON from Postman

app.post("/create-transactions", async (req, res) => {
  try {
    const token = await getAccessToken();
    if (!token) {
      return res.status(401).json({ success: false, message: "No access token" });
    }

    // Get data from Postman request body
    const incomingData = req.body;
    
    if (!incomingData || Object.keys(incomingData).length === 0) {
      return res.status(400).json({ success: false, message: "No data provided in request body" });
    }

    // Create transaction with the data from Postman
    const result = await createTransaction(token, incomingData);
    
    res.status(200).json({
      success: true,
      message: "Transaction and Deal created successfully",
      result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("✅ Zoho CRM Transaction + Deal Creation API Running...");
});

// ------------------- START SERVER -------------------
app.listen(port, () => console.log(`🚀 Server running at http://localhost:${port}`));
