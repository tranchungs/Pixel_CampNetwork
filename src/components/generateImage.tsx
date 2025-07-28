export async function generateImage(
  model: "bear" | "fox" | "goat",
  jwt: string
) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_VITE_ORIGIN_API}/auth/merv/generate-image`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model_type: model }),
    }
  );
  const { data } = await res.json();
  return data.images as { id: string; url: string }[];
}
export async function getCredits(jwt: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_VITE_ORIGIN_API}/auth/merv/check-generations`,
    {
      headers: { Authorization: `Bearer ${jwt}` },
    }
  );
  const { data } = await res.json();
  return data.generations_left as number;
}
export async function assignImage(imageId: string, jwt: string) {
  await fetch(
    `${process.env.NEXT_PUBLIC_VITE_ORIGIN_API}/auth/merv/assign-image`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image_id: imageId }),
    }
  );
}
