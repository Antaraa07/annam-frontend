"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

type Field = {
  key: string;
  label: string;
  required?: boolean;
  type?: "text" | "date" | "select" | "textarea";
  options?: string[];
  placeholder?: string;
};

export type UploadMetadata = Record<string, string>;

const cropStageOptions = ["Seedling", "Vegetative", "Flowering", "Harvest"];
const withCustom = (options: string[]) => [...options, "Custom"];
const diseaseTypeOptions = withCustom(["Fungal", "Bacterial", "Viral", "Nematode", "Physiological"]);
const severityOptions = ["Mild", "Moderate", "Severe", "Unknown"];
const activeTimeOptions = withCustom(["Day", "Night", "Both"]);
const damageTypeOptions = withCustom(["Holes", "Mining", "Chewing", "Boring", "Skeletonization", "Sap sucking"]);
const plantPartOptions = withCustom(["Leaf", "Stem", "Root", "Fruit"]);
const symptomTypeOptions = withCustom(["Lesion", "Spot", "Blight", "Wilt", "Rot", "Chlorosis", "Mosaic", "Rust", "Mildew"]);
const suspectedCauseOptions = withCustom(["Hail", "Frost", "Heat Stress", "Waterlogging", "Herbicide Injury", "Animal Damage", "Machinery", "Unknown"]);

const cropTypeOptions = withCustom([
  "Agronomical Crops",
  "Vegetables",
  "Spices & Herbs",
  "Fruit Crops",
  "Cash & Forestry Crops",
  "Other",
  "Trees",
  "Flowers",
  "Ornamental"
]);

const pestNameOptions = withCustom([
  "Thrips",
  "Brown Plant Hopper",
  "Yellow Stemborer",
  "Gall midge",
  "Leaf folder",
  "Case worm",
  "Whorl maggot",
  "Swarming caterpillar",
  "Skipper",
  "Green horned caterpillar",
  "Yellow hairy caterpillar",
  "Grasshopper",
  "Mealy bug",
  "Spiny beetle / Hispa",
  "Green leafhopper",
  "White backed plant hopper",
  "Earhead bug",
  "Aphid",
  "Cutworm",
  "Armyworm",
  "Gram pod borer",
  "Termites",
  "Planthopper",
  "Jassids",
  "Wheat bug/ Stink bug",
  "Pink stem borer",
  "Flea beetle",
  "American boll worm",
  "Pink bollworm",
  "Stem borer",
  "Leaf roller",
  "Tobacco Cutworm",
  "Leaf hopper",
  "Whitefly",
  "Red cotton bug",
  "Dusky cotton bug",
  "Mealy bugs",
  "Fall armyworm",
  "Rootworm",
  "Mealybug",
  "White grub",
  "White flies",
  "Saw fly"
]);

const diseaseNameOptions = withCustom([
  "Bacterial Spot",
  "Cercospora Leaf Spot",
  "Powdery Mildew white spot",
  "Leaf Curl",
  "Alternaria Leaf Spot",
  "Bacterial Blight",
  "Boll Rot",
  "Curl Virus",
  "Fusarium Wilt",
  "Powdery Mildew",
  "Target Spot",
  "Verticillium Wilt",
  "Anthracnose Leaf Blight",
  "Bacterial Leaf Streak of Corn",
  "Banded Leaf & Sheath Blight",
  "Brown Spot",
  "Common Rust",
  "Grey Leaf Spot",
  "Mildew",
  "Northern Leaf Blight",
  "Smut",
  "Southern Leaf Blight",
  "Streak",
  "Stripe",
  "Leaf Blight",
  "Rust Leaf",
  "Blast",
  "Downy Mildew",
  "Tungro",
  "Bacterial Leaf Streak",
  "Bacterial Panicle Blight",
  "Leaf Scald",
  "Fusarium Foot Rot"
]);

export const METADATA_SCHEMAS: Record<string, Field[]> = {
  Healthy: [
    { key: "crop_type", label: "Crop Type", required: true, type: "select", options: cropTypeOptions },
    { key: "crop_name", label: "Crop Name", required: true, placeholder: "e.g., Tomato" },
    { key: "planting_date", label: "Planting Date", type: "date" },
    { key: "plant_part", label: "Plant Part", placeholder: "e.g., Leaf" },
    { key: "crop_stage", label: "Crop Stage", placeholder: "e.g., Flowering" },
    { key: "variety", label: "Variety", placeholder: "e.g., Arka Vikas" },
    { key: "location", label: "Location", placeholder: "Village, district, state" },
    { key: "date_collected", label: "Date Collected", type: "date" },
    { key: "observation", label: "Observation", type: "textarea", placeholder: "Any useful field observations" },
  ],
  Disease: [
    { key: "crop_type", label: "Crop Type", required: true, type: "select", options: cropTypeOptions },
    { key: "crop_name", label: "Crop Name", required: true, placeholder: "e.g., Tomato" },
    { key: "planting_date", label: "Planting Date", type: "date" },
    { key: "disease_name", label: "Disease Name", required: true, type: "select", options: diseaseNameOptions },
    { key: "plant_part_affected", label: "Plant Part Affected", type: "select", options: plantPartOptions },
    { key: "growth_stage", label: "Growth Stage", type: "select", options: cropStageOptions },
    { key: "causal_organism", label: "Causal Organism", placeholder: "e.g., Alternaria solani" },
    { key: "disease_type", label: "Disease Type", type: "select", options: diseaseTypeOptions },
    { key: "severity", label: "Severity", type: "select", options: severityOptions },
    { key: "location", label: "Location", placeholder: "Village, district, state" },
    { key: "date_collected", label: "Date Collected", type: "date" },
    { key: "observation", label: "Observation", type: "textarea", placeholder: "Visible symptoms or observations" },
  ],
  Pest: [
    { key: "crop_type", label: "Crop Type", required: true, type: "select", options: cropTypeOptions },
    { key: "crop_name", label: "Crop Name", required: true, placeholder: "e.g., Tomato" },
    { key: "pest_name", label: "Pest Name", required: true, type: "select", options: pestNameOptions },
    { key: "crop_stage", label: "Crop Stage", placeholder: "e.g., Fruiting" },
    { key: "scientific_name", label: "Scientific Name", placeholder: "e.g., Aphis gossypii" },
    { key: "importance", label: "Major/Minor", type: "select", options: withCustom(["Major", "Minor"]) },
    { key: "plant_part_attacked", label: "Plant Part Attacked", placeholder: "e.g., Young leaves" },
    { key: "active_time", label: "Active Time", type: "select", options: activeTimeOptions },
    { key: "location", label: "Location", placeholder: "Village, district, state" },
    { key: "date_collected", label: "Date Collected", type: "date" },
    { key: "observation", label: "Observation", type: "textarea", placeholder: "Any useful field observations" },
  ],
  "Disease Damage": [
    { key: "crop_type", label: "Crop Type", required: true, type: "select", options: cropTypeOptions },
    { key: "crop_name", label: "Crop Name", required: true, placeholder: "e.g., Potato" },
    { key: "planting_date", label: "Planting Date", type: "date" },
    { key: "suspected_disease", label: "Suspected Disease", required: true, type: "select", options: diseaseNameOptions },
    { key: "plant_part_affected", label: "Plant Part Affected", type: "select", options: plantPartOptions },
    { key: "symptom_type", label: "Symptom Type", type: "select", options: symptomTypeOptions },
    { key: "crop_stage", label: "Crop Stage", placeholder: "e.g., Vegetative" },
    { key: "severity", label: "Severity", type: "select", options: severityOptions },
    { key: "location", label: "Location", placeholder: "Village, district, state" },
    { key: "date_collected", label: "Date Collected", type: "date" },
    { key: "observation", label: "Observation", type: "textarea", placeholder: "Visible symptoms or observations" },
  ],
  "Pest Damage": [
    { key: "crop_type", label: "Crop Type", required: true, type: "select", options: cropTypeOptions },
    { key: "crop_name", label: "Crop Name", required: true, placeholder: "e.g., Tomato" },
    { key: "planting_date", label: "Planting Date", type: "date" },
    { key: "suspected_pest", label: "Suspected Pest", required: true, type: "select", options: pestNameOptions },
    { key: "damaged_plant_part", label: "Damaged Plant Part", placeholder: "e.g., Leaf" },
    { key: "damage_type", label: "Damage Type", type: "select", options: damageTypeOptions },
    { key: "crop_stage", label: "Crop Stage", placeholder: "e.g., Seedling" },
    { key: "severity", label: "Severity", type: "select", options: severityOptions },
    { key: "location", label: "Location", placeholder: "Village, district, state" },
    { key: "date_collected", label: "Date Collected", type: "date" },
    { key: "observation", label: "Observation", type: "textarea", placeholder: "Visible damage or observations" },
  ],
  Damage: [
    { key: "crop_type", label: "Crop Type", required: true, type: "select", options: cropTypeOptions },
    { key: "crop_name", label: "Crop Name", required: true, placeholder: "e.g., Maize" },
    { key: "planting_date", label: "Planting Date", type: "date" },
    { key: "damage_type", label: "Damage Type", type: "select", options: damageTypeOptions },
    { key: "plant_part_affected", label: "Plant Part Affected", type: "select", options: plantPartOptions },
    { key: "crop_stage", label: "Crop Stage", placeholder: "e.g., Vegetative" },
    { key: "suspected_cause", label: "Suspected Cause", type: "select", options: suspectedCauseOptions },
    { key: "severity", label: "Severity", type: "select", options: severityOptions },
    { key: "location", label: "Location", placeholder: "Village, district, state" },
    { key: "date_collected", label: "Date Collected", type: "date" },
    { key: "observation", label: "Observation", type: "textarea", placeholder: "Visible damage or observations" },
  ],
};

type Props = {
  category: string;
  initialMetadata: UploadMetadata | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (metadata: UploadMetadata) => void;
};

export function UploadMetadataDialog({ category, initialMetadata, open, onOpenChange, onSave }: Props) {
  const [draft, setDraft] = useState<UploadMetadata>(initialMetadata ?? {});
  const fields = METADATA_SCHEMAS[category] ?? [];
  const inputClass = "w-full rounded-lg border border-zinc-700/50 bg-zinc-800/60 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20";

  function save() {
    const missing = fields.find((field) => field.required && !draft[field.key]?.trim());
    if (missing) {
      toast.error(`${missing.label} is required.`);
      return;
    }

    const metadata = { ...draft };
    for (const field of fields) {
      const customKey = `custom_${field.key}`;
      if (metadata[field.key] === "Custom") {
        if (!metadata[customKey]?.trim()) {
          toast.error(`Enter a custom value for ${field.label}.`);
          return;
        }
        metadata[field.key] = metadata[customKey].trim();
      }
      delete metadata[customKey];
    }

    onSave(metadata);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-h-[90vh] max-w-2xl gap-0 overflow-hidden border-zinc-700 bg-zinc-900 p-0 text-zinc-100 sm:max-w-2xl">
        <DialogHeader className="border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center justify-between gap-3 pr-8">
            <DialogTitle className="text-base font-semibold text-white">{category} metadata</DialogTitle>
            <span className="shrink-0 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">{category}</span>
          </div>
          <DialogDescription className="text-xs text-zinc-400">These details are saved with every image in this upload batch. Required fields are marked with an asterisk.</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[60vh] grid-cols-1 gap-3 overflow-y-auto px-5 py-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
              <label className="mb-1 block text-xs font-medium text-zinc-300">
                {field.label}{field.required && <span className="ml-1 text-red-400">*</span>}
              </label>
              {field.type === "textarea" ? (
                <textarea rows={3} value={draft[field.key] ?? ""} placeholder={field.placeholder} onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })} className={`${inputClass} resize-none`} />
              ) : field.type === "select" ? (
                (() => {
                  const customKey = `custom_${field.key}`;
                  const hasCustomOption = field.options?.includes("Custom") ?? false;
                  const savedCustomValue = hasCustomOption && draft[field.key] && !field.options?.includes(draft[field.key]);
                  const selectedValue = savedCustomValue ? "Custom" : draft[field.key] ?? "";

                  return (
                    <div className="space-y-2">
                      <select
                        value={selectedValue}
                        onChange={(e) => setDraft({
                          ...draft,
                          [field.key]: e.target.value,
                          ...(e.target.value === "Custom" ? { [customKey]: "" } : {}),
                        })}
                        className={inputClass}
                      >
                        <option value="">Select {field.label.toLowerCase()}...</option>
                        {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                      {selectedValue === "Custom" && (
                        <input
                          value={draft[customKey] ?? (savedCustomValue ? draft[field.key] : "")}
                          placeholder={`Enter custom ${field.label.toLowerCase()}`}
                          onChange={(e) => setDraft({ ...draft, [customKey]: e.target.value })}
                          className={inputClass}
                        />
                      )}
                    </div>
                  );
                })()
              ) : (
                <input type={field.type === "date" ? "date" : "text"} value={draft[field.key] ?? ""} placeholder={field.placeholder} onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })} className={inputClass} />
              )}
            </div>
          ))}
        </div>
        <DialogFooter className="mx-0 mb-0 border-zinc-800 bg-zinc-900 px-5 py-3 sm:justify-end">
          <button type="button" onClick={() => onOpenChange(false)} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800">Cancel</button>
          <button type="button" onClick={save} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400">Save metadata</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
