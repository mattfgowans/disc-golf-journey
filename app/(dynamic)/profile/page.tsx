export default function Page() {
  if (typeof window === "undefined") {
    return null;
  }

  const ProfileClient = require("./ProfileClient").default;
  return <ProfileClient />;
}
