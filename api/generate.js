import { fal } from "@fal-ai/client";

fal.config({
  credentials: process.env.FAL_KEY,
});

// Konfigurasi khusus Vercel agar menerima payload gambar besar
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
  maxDuration: 60,
};

export default async function handler(req, res) {
  // Set header agar selalu mengembalikan JSON
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  // Cek apakah FAL_KEY sudah diisi di Vercel
  if (!process.env.FAL_KEY) {
    return res.status(500).json({ 
      success: false, 
      error: "FAL_KEY belum disetel di Environment Variables Vercel!" 
    });
  }

  try {
    const { 
      productCategory, 
      modelOption, 
      bgType, 
      drapeStyle, 
      rawImages 
    } = req.body;

    const baseProductImage = rawImages && rawImages.length > 0 ? rawImages[0] : null;

    if (!baseProductImage) {
      return res.status(400).json({ 
        success: false, 
        error: "Minimal 1 foto produk mentahan wajib diunggah!" 
      });
    }

    const angles = [
      {
        name: "Cover Utama (Front)",
        prompt: `Commercial e-commerce catalog photo of an ${modelOption || 'Indonesian model'} wearing ${productCategory || 'abaya hijab'}, clean front angle view, elegant fit, ${drapeStyle || 'neat drape'}, ${bgType || 'studio beige arch background'}, soft commercial lighting, photorealistic, 8k fashion catalog`
      },
      {
        name: "Macro Detail Kain & Jahitan",
        prompt: `Extreme macro close-up shot of authentic fabric texture, seams, edge finishing, premium stitching of ${productCategory || 'abaya hijab'}, commercial product photography, depth of field, sharp daylight`
      },
      {
        name: "Side Flowy Drape",
        prompt: `Side profile view of elegant model wearing ${productCategory || 'abaya hijab'}, showcasing graceful flowing fabric drape, modest silhouette, aesthetic soft shadows`
      },
      {
        name: "Lifestyle Look",
        prompt: `Full-body lifestyle catalog shot of Indonesian Muslimah wearing modern ${productCategory || 'abaya hijab'}, walking pose in ${bgType || 'studio ambient'}, natural aesthetic lighting, trending marketplace visual`
      }
    ];

    // Eksekusi render 4 foto paralel via Fal.ai
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
    console.error("Vercel AI Error:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || "Gagal memproses gambar AI di Fal.ai" 
    });
  }
}
