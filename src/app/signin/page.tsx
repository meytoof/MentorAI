import { redirect } from "next/navigation";

export default async function SignInPage(props: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const searchParams = await props.searchParams;
  const callbackUrl = searchParams?.callbackUrl;
  const path = callbackUrl
    ? `/accueil?login=1&callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/accueil?login=1";
  redirect(path);
}
