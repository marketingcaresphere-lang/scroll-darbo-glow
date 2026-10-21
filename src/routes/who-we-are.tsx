import { createFileRoute } from "@tanstack/react-router";
import { WhoPage } from "@/who/WhoPage";

export const Route = createFileRoute("/who-we-are")({
  head: () => ({
    meta: [
      { title: "Who We Are — LeadZLoco™" },
      {
        name: "description",
        content:
          "A human leader gives the vision. A tireless machine workforce carries it out. Meet the people behind LeadZLoco.",
      },
      { property: "og:title", content: "Who We Are — LeadZLoco™" },
      {
        property: "og:description",
        content: "A human leader gives the vision. A tireless machine workforce carries it out.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WhoWeAre,
});

function WhoWeAre() {
  return <WhoPage />;
}
