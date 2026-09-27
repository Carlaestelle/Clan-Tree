const FAMILY_NAME = "[Family name]";
const PRIMARY_CONTRIBUTORS = ["[James Kazimoto]", "[Nderakindo Perpetua]"];
const ALSO_THANKS = "and members of the wider family for additional details";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full max-w-2xl mx-auto pt-6">
      <div className="divider-fade mb-4" />
      <p className="text-center text-xs text-ash">
        © {year} The {FAMILY_NAME} Family Archive. Compiled from research and
        recollections. As of Aug 2006 by {PRIMARY_CONTRIBUTORS.join(" and ")}, {ALSO_THANKS}.
      </p>
    </footer>
  );
}