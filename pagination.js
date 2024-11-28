// Function to parse XML string and extract links
function parseSitemap(xmlString) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  const links = xmlDoc.getElementsByTagName('loc');
  const linksArray = Array.from(links).map(link => link.innerHTML);
  return linksArray;
}

// Function to display links for a specific page
function displayLinks(links, page, pageSize) {
  const list = document.getElementById('sitemapLinks');
  list.innerHTML = '';

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedLinks = links.slice(startIndex, endIndex);

  paginatedLinks.forEach((link, index) => {
    const listItem = document.createElement('li');
    listItem.textContent = `${startIndex + index + 1}. ${link}`;
    list.appendChild(listItem);
  });
}

// Function to create pagination buttons
function createPaginationButtons(links, pageSize) {
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';

  const totalPages = Math.ceil(links.length / pageSize);
  for (let i = 1; i <= totalPages; i++) {
    const listItem = document.createElement('li');
    listItem.textContent = i;
    listItem.addEventListener('click', () => {
      displayLinks(links, i, pageSize);
    });
    pagination.appendChild(listItem);
  }
}

// Fetch the sitemap.xml file
const request = new XMLHttpRequest();
request.onreadystatechange = function() {
  if (this.readyState === 4 && this.status === 200) {
    const sitemapXML = this.responseText;
    const links = parseSitemap(sitemapXML);
    const pageSize = 10; // Adjust the number of links per page
    createPaginationButtons(links, pageSize);
    displayLinks(links, 1, pageSize);
  } else if (this.readyState === 4) {
    console.error('Error fetching sitemap.xml');
  }
};
request.open('GET', 'jquery-plugins.xml', true); // Replace with your sitemap file
request.send();
