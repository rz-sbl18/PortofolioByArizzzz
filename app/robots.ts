import type { MetadataRoute } from "next";

// Mode "tidak diindeks": meminta mesin pencari tidak merayapi website.
// Untuk membuka ke publik nanti: ganti isinya menjadi
//   { rules: { userAgent: "*", allow: "/", disallow: "/admin" } }
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
