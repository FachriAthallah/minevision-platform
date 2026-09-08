import { BriefcaseBusiness, Compass, DraftingCompass, Factory, HardHat, Leaf, MapPinned, MonitorCog, Scale, ShieldCheck, Truck, Users, Wrench, type LucideIcon } from "lucide-react";
export const careerIcons: Record<string, LucideIcon> = {
  "eksplorasi-dan-geologi": Compass, "perencanaan-dan-rekayasa-tambang": DraftingCompass,
  "operasi-dan-produksi-tambang": HardHat, "survei-gis-dan-geospasial": MapPinned,
  "pengolahan-mineral-dan-metalurgi": Factory, "keselamatan-kesehatan-dan-tanggap-darurat": ShieldCheck,
  "lingkungan-dan-keberlanjutan": Leaf, "pemeliharaan-dan-keandalan-peralatan": Wrench,
  "logistik-rantai-pasok-dan-pengadaan": Truck, "data-teknologi-informasi-dan-otomasi": MonitorCog,
  "keuangan-komersial-dan-manajemen": BriefcaseBusiness, "legal-perizinan-dan-kepatuhan": Scale,
  "sumber-daya-manusia-dan-administrasi": Users,
};

