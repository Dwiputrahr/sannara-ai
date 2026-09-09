import { fal } from "@fal-ai/client";

fal.config({
  credentials: process.env.FAL_KEY,
});

export default async function handler(req, res) {
  // Hanya menerima method POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { 
      productCategory, 
      modelOption, 
      bgType, 
      drapeStyle, 
      rawImages 
    } = req.body;

    const baseProductImage = rawImages && rawImages[0] ? rawImages[0] : null;

    if (!baseProductImage) {
      return res.status(400).json({ error: "Minimal 1 foto produk mentahan wajib diunggah!" });
    }

    // 4 Skenario Pemotretan Marketplace Sannara
    const angles = [
      {
        name: "Cover Utama (Front)",
        prompt: `Commercial e-commerce catalog photo of an ${modelOption} wearing ${productCategory}, clean front angle view, elegant fit, ${drapeStyle}, ${bgType}, studio softbox lighting, 8k resolution, photorealistic fashion editorial, sharp details`
      },
      {
        name: "Macro Detail Kain & Jahitan",
        prompt: `Extreme macro close-up shot of the authentic fabric texture, seams, edge finishing, label tag of ${productCategory}, luxurious material weave, commercial product photography, depth of field, studio daylight`
      },
      {
        name: "Side Flowy Drape",
        prompt: `Side profile view of elegant ${modelOption} wearing ${productCategory}, showcasing graceful flowing fabric, neat hijab drape, modest aesthetic silhouette, soft daylight, premium e-commerce lookbook`
      },
      {
        name: "Lifestyle Look",
        prompt: `Full-body lifestyle catalog shot of ${modelOption} wearing modern ${productCategory}, walking pose in ${bgType}, natural aesthetic sunlight, elegant color grading, trending Shopee/TikTok Shop high-converting visual`
      }
    ];

    // Eksekusi render 4 foto secara paralel
    const renderPromises = angles.map(async (angle) => {
      const response = await fal.subscribe("fal-ai/flux-lora/image-to-image", {
        input: {
          image_url: baseProductImage,
          prompt: angle.prompt,
          strength: 0.65,
          guidance_scale: 3.5,
          image_size: "square_hd"
        }
      });
      return {
        title: angle.name,
        url: response.data.images[0].url
      };
    });

    const results = await Promise.all(renderPromises);
    return res.status(200).json({ success: true, images: results });

  } catch (error) {
    console.error("Vercel AI Execution Error:", error);
    return res.status(500).json({ error: error.message || "Gagal memproses gambar AI" });
  }
}
