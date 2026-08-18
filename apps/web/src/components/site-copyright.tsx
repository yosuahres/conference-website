import { copyright } from "@/content/site";
import { Container } from "./site/ui";

export function SiteCopyright() {
  return (
    <footer className="bg-ink pb-24 pt-5 md:pb-5">
      <Container>
        <p className="text-center text-[0.78rem] text-paper/80">{copyright}</p>
      </Container>
    </footer>
  );
}
