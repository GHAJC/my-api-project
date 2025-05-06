const axios = require('axios');

module.exports = async (req, res) => {
  const { productName, productDescrip, productPrice, productQuantity } = req.body;

  const token = process.env.GITHUB_TOKEN; // Set this in Vercel dashboard
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
    const content = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf8'));

    content.products.push({
      ProductID: String(Date.now()),
      ProductName: productName,
      ProductDescrip: productDescrip,
      ProductPrice: productPrice,
      ProductQuantity: productQuantity
    });

    const updatedContent = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');

    await axios.put(apiUrl, {
      message: 'Add new product',
      content: updatedContent,
      sha: fileData.sha,
      branch
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    res.status(200).json({ message: 'Product added successfully' });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to update GitHub file' });
  }
};
