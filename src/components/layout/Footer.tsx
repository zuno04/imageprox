export function Footer() {
  return (
    <footer className="py-6 px-4 sm:px-6 border-t border-border mt-auto transition-colors duration-150 ease-in-out">
      <div className="container mx-auto text-center text-sm text-muted-foreground space-y-1">
        {/* Added classes here */}
        <p>
          {/* Removed classes from here as they are on parent */}
          ImageMod © {new Date().getFullYear()}. Built with React, Vite,
          TypeScript & Shadcn/ui.
        </p>
        <p>
          <a
            href="mailto:feedback@example.com?subject=ImageMod App Feedback"
            className="hover:text-primary hover:underline transition-colors"
          >
            Send Feedback
          </a>
        </p>
      </div>
    </footer>
  );
}
