const axios = require('axios');

module.exports = async (req, res) => {
  // ✅ Handle CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // 👈 Preflight success
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ✅ Continue with the existing logic
  const {
    ProductID,
    ProductName,
    ProductDescrip,
    ProductPrice,
    ProductQuantity
  } = req.body;

  const token = process.env.GITHUB_TOKEN;
  const owner = 'GHAJC';
  const repo = 'OnlineStoreJSONFiles';
  const filePath = 'data/products.json';
  const branch = 'main';
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  try {
    const getFile = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    const fileData = getFile.data;
    const currentProducts = JSON.parse(
      Buffer.from(fileData.content, 'base64').toString('utf8')
    );

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

    await axios.put(apiUrl, {
      message: index >= 0 ? `Update product ${product.ProductID}` : 'Add new product',
      content: updatedContent,
      sha: fileData.sha,
      branch
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    res.status(200).json({
      message: index >= 0 ? 'Product updated' : 'Product added',
      product
    });

  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;
    console.error("❌ GitHub API error:", message);
    res.status(status).json({
      error: 'Failed to update GitHub file',
      details: message
    });
  }
};
