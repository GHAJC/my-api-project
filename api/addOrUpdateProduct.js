const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!req.body) {
    return res.status(400).json({ error: 'Missing request body' });
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
    // Fetch existing file from GitHub
    const getFile = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    const fileData = getFile.data;

    console.log("📄 File retrieved from GitHub");
    console.log("🔑 SHA:", fileData.sha);

    const currentProducts = JSON.parse(
      Buffer.from(fileData.content, 'base64').toString('utf8')
    );

    // Prepare product
    const product = {
      ProductID: ProductID || String(Date.now()),
      ProductName,
      ProductDescrip,
      ProductPrice,
      ProductQuantity
    };

    // Add or update
    const index = currentProducts.products.findIndex(p => p.ProductID === product.ProductID);
    if (index >= 0) {
      currentProducts.products[index] = product;
      console.log("🛠️ Updating product:", product.ProductID);
    } else {
      currentProducts.products.push(product);
      console.log("➕ Adding new product:", product.ProductID);
    }

    // Encode new content
    const updatedContent = Buffer.from(JSON.stringify(currentProducts, null, 2)).toString('base64');

    // Put request to GitHub
    const updateResponse = await axios.put(apiUrl, {
      message: index >= 0
        ? `Update product ${product.ProductID}`
        : 'Add new product',
      content: updatedContent,
      sha: fileData.sha,
      branch
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    console.log("✅ GitHub file updated successfully");
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
