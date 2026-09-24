import { useEffect } from "react";

export default function WhatsAppDevPage() {
  useEffect(() => {
    const session = new URLSearchParams(window.location.search).get("session");

    if (!session) {
      window.location.href = "/";
      return;
    }

    // CHANGE THIS to your deployed MBS SMS provider URL
    const providerUrl = process.env.MBS_SMS_BOT || "https://sms-service-7ai0.onrender.com" ;    

    window.location.replace(
      `${providerUrl}/dev?session=${encodeURIComponent(session)}`
    );
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      Connecting to WhatsApp...
    </div>
  );
}