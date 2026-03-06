interface TopBarProps {
  children: React.ReactNode;
}

const logoUrl = `${import.meta.env.BASE_URL}logo.png`;

export function TopBar({ children }: TopBarProps) {
  return (
    <div className="flex items-center gap-3 px-4 pt-4 pb-2">
      <img
        src={logoUrl}
        alt="CurlBro"
        className="h-9 w-9 flex-shrink-0 rounded-lg object-contain brightness-75 dark:brightness-100"
      />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
