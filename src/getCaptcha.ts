import axios from "axios";

export function removeBase64Prefix(base64String: string) {
  const prefix = "data:image/jpeg;base64,";
  if (base64String.startsWith(prefix)) {
    return base64String.slice(prefix.length);
  }
  return base64String;
}

export async function getCaptchaFromApi(base64Image: string, apiUrl: string) {
  try {
    const b64image = removeBase64Prefix(base64Image);
    console.debug("b64image", b64image);
    const payload = {
      base64_str: b64image,
    };

    const headers = {
      "Content-Type": "application/json",
    };

    const response = await axios.post(apiUrl, payload, {
      headers,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const responseData = response.data;
    return responseData.data;
  } catch (error) {
    console.error("Error:", error);
    return "";
  }
}
