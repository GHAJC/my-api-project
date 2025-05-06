const axios = require('axios');

module.exports = async (req, res) => {
  // 🔒 CORS HEADERS
  res.setHeader('Access-Control-Allow-Origin', '*'); // Replace * with your domain for better security
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 🔁 Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ❌ Block anything not POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    ProductID,
    ProductName,
    ProductDescrip,
    ProductPrice,
    ProductQuantity
  } = req.body;

  console.log("📥 Incoming request body:", req.body);

  const token = process.env.GITHUB_TOKEN;
  const owner = 'GHAJC';
  const repo = 'OnlineStoreJSONFiles';
  const filePath = 'data/products.json';
  const branch = 'main';

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  try {
    // 📄 GET existing content
    const getFile = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    const fileData = getFile.data;
    const currentProducts = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf8'));

    // ➕ New or Update
    const product = {
      ProductID: ProductID || String(Date.now()),
      ProductName,
      ProductDescrip,
      ProductPrice,
      ProductQuantity
    };

    const index = currentProducts.products.findIndex(p => p.ProductID === product.ProductID);
    if (index >= 0) {
      currentProducts.products[index] = product;
    } else {
      currentProducts.products.push(product);
    }

    const updatedContent = Buffer.from(JSON.stringify(currentProducts, null, 2)).toString('base64');

    // ✅ PUT update
    await axios.put(apiUrl, {
      message: index >= 0 ? `Update product ${product.ProductID}` : `Add product ${product.ProductID}`,
      content: updatedContent,
      sha: fileData.sha,
      branch
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    res.status(200).json({ message: 'Product saved', product });

  } catch (error) {
    console.error('❌ GitHub Error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to update GitHub',
      details: error.response?.data || error.message
    });
  }
};
