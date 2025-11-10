import React, { useEffect, useState } from "react";
import { apiMe } from "./auth";
import { motion } from "framer-motion";

function maskEmail(email) {
  if (!email) return "";
  const [name, domain] = email.split("@");
  if (!domain) return email;
  return `${name.slice(0, 2)}***@${domain}`;
}

function Profile() {
  const [me, setMe] = useState(null);

  useEffect(() => {
    (async () => {
      const resp = await apiMe();
      setMe(resp);
    })();
  }, []);

  const profile = me?.user?.profile || {};

  return (
    <div
      className="container"
      style={{ minHeight: "100vh", paddingTop: "40px", paddingBottom: "40px" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="card"
      >
        <div className="stack mb-4">
          <h2 className="mb-0">Your Profile</h2>
          <p className="muted text-sm">Basic information from PESU profile</p>
        </div>

        <div className="grid grid-cols-2">
          <ProfileItem label="Name" value={profile?.name} />
          <ProfileItem label="SRN" value={profile?.srn} />
          <ProfileItem label="Program" value={profile?.program} />
          <ProfileItem label="Branch" value={profile?.branch} />
          <ProfileItem label="Semester" value={profile?.semester} />
          <ProfileItem label="Section" value={profile?.section} />
          <ProfileItem label="Campus" value={profile?.campus} />
          <ProfileItem label="Email" value={maskEmail(profile?.email)} />
        </div>
      </motion.div>
    </div>
  );
}

function ProfileItem({ label, value }) {
  return (
    <div className="card">
      <div className="text-sm muted mb-2">{label}</div>
      <div className="text-base">{value || "—"}</div>
    </div>
  );
}

export default Profile;
