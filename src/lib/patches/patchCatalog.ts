export type PatchSlug = "skill" | "social" | "collection";

export type Patch = {
  slug: PatchSlug;
  title: string;
  subtitle: string;
  imageSrc: string;
  tabKey: "skill" | "social" | "collection";
};

export const PATCHES: Patch[] = [
  {
    slug: "skill",
    title: "Skill Patch",
    subtitle: "Earn by reaching 80% mastery in the Skill tab.",
    imageSrc: "/patches/skill-wedge-v2.png",
    tabKey: "skill",
  },
  {
    slug: "social",
    title: "Social Patch",
    subtitle: "Earn by reaching 80% mastery in the Social tab.",
    imageSrc: "/patches/social-wedge-v2.png",
    tabKey: "social",
  },
  {
    slug: "collection",
    title: "Collection Patch",
    subtitle: "Earn by reaching 80% mastery in the Collection tab.",
    imageSrc: "/patches/collection-wedge-v2.png",
    tabKey: "collection",
  },
];
