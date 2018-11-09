// NB: takes image details in the form of the CAPI mainImage.members[0] obj

function formatImageUrl(capiMainImageMember, size) {
  const isUPPImage = checkUrl(capiMainImageMember.binaryUrl);
  let format;

  if (isUPPImage) {
    const uuid = extractUUID(capiMainImageMember);
    format = `${process.env.IMAGE_SERVICE_URL}${
      process.env.REPLACE_IMG_URL
    }${uuid}`;
  } else {
    format = `${process.env.IMAGE_SERVICE_URL}${encodeURIComponent(
      capiMainImageMember.binaryUrl
    )}`;
  }
  return format.concat(`?source=ftlabs&width=${size}`);
}

function resizeImageURL(url, size){
  const parts = url.split('?');
  return parts[0].concat(`?source=ftlabs&width=${size}`);
}

function checkUrl(url) {
  const ftcmsImageRegex = /^https?:\/\/(?:(?:www\.)?ft\.com\/cms|im\.ft-static\.com\/content\/images|com\.ft\.imagepublish\.(?:prod|upp-prod-eu|upp-prod-us)\.s3\.amazonaws\.com|prod-upp-image-read\.ft\.com)\/([a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12})/g;
  return ftcmsImageRegex.test(url);
}

function extractUUID(capiMainImageMember) {
  if (capiMainImageMember !== undefined) {
    const linkWithoutHTTP = capiMainImageMember.apiUrl.split("://")[1];
    return linkWithoutHTTP
      .replace("api.ft.com/content/", "")
      .replace("api.ft.com/things/", "");
  }

  return undefined;
}

module.exports = { formatImageUrl, resizeImageURL };
