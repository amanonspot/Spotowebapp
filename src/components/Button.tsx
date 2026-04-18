interface ButtonProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
}

export default function Button({ label, isActive, onClick }: ButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`
          px-8 py-3 rounded-xl font-montserrat font-semibold transition-all duration-300
          border border-[#AF7AEB] border-opacity-50 hover:border-opacity-100
          ${
              isActive
                  ? "bg-[#AF7AEB] text-white shadow-lg shadow-[#AF7AEB]/50"
                  : "bg-[#262929] text-white/70 hover:bg-[#AF7AEB] hover:bg-opacity-20"
          }
        `}
        >
            {label}
        </button>
    );
}
