import { useEffect } from "react";
import { useRouter } from "expo-router";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      router.replace("/userInfo");
    }, 100);
  }, [router]);

  return null;
}
