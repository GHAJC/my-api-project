const axios = require('axios');

module.exports = async (req, res) => {
  const {
    ProductID, // Optional — if present, we’ll edit
    ProductName,
    ProductDescrip,
    ProductPrice,
    ProductQuantity
  } = req.body;

  const token = process.env.GITHUB_TOKEN; // Set this in your Vercel project
  const owner = 'GHAJC';
  const repo = 'OnlineStoreJSONFiles';
  const filePath = 'data/products.json';
  const branch = 'main';
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  try {
    // Step 1: Fetch existing file
    const getFile = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    const fileData = getFile.data;
    const currentProducts = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf8'));

    // Step 2: Prepare product object
    const product = {
      ProductID: ProductID || String(Date.now()),
      ProductName,
      ProductDescrip,
      ProductPrice,
      ProductQuantity
    };

    // Step 3: Check if we're editing or adding
    const index = currentProducts.products.findIndex(p => p.ProductID === product.ProductID);

    if (index >= 0) {
      // ✅ Update existing
      currentProducts.products[index] = product;
    } else {
      // ➕ Add new
      currentProducts.products.push(product);
    }

    // Step 4: Save back to GitHub
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
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to update GitHub file' });
  }
};
