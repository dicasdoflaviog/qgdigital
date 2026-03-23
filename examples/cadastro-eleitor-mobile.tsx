"use client";

import * as React from "react";
import {
  ChevronLeft,
  User,
  Phone,
  MapPin,
  FileText,
  Check,
  Camera,
  X,
  AlertCircle,
} from "lucide-react";
import { MobileHeader } from "@/components/mobile";
import { cn } from "@/lib/utils";

// ============================================
// 📱 Cadastro de Eleitor - Mobile Multi-step
// ============================================

type Step = "dados" | "contato" | "endereco" | "observacoes" | "sucesso";

interface FormData {
  nome: string;
  cpf: string;
  dataNascimento: string;
  telefone: string;
  whatsapp: string;
  email: string;
  cep: string;
  bairro: string;
  rua: string;
  numero: string;
  complemento: string;
  observacoes: string;
  foto: string | null;
}

const initialFormData: FormData = {
  nome: "",
  cpf: "",
  dataNascimento: "",
  telefone: "",
  whatsapp: "",
  email: "",
  cep: "",
  bairro: "",
  rua: "",
  numero: "",
  complemento: "",
  observacoes: "",
  foto: null,
};

const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: "dados", label: "Dados", icon: <User className="w-4 h-4" /> },
  { id: "contato", label: "Contato", icon: <Phone className="w-4 h-4" /> },
  { id: "endereco", label: "Endereço", icon: <MapPin className="w-4 h-4" /> },
  { id: "observacoes", label: "Obs", icon: <FileText className="w-4 h-4" /> },
];

export default function CadastroEleitorMobile() {
  const [currentStep, setCurrentStep] = React.useState<Step>("dados");
  const [formData, setFormData] = React.useState<FormData>(initialFormData);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const isLastStep = currentStepIndex === steps.length - 1;
  const isSuccess = currentStep === "sucesso";

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpar erro do campo ao editar
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    switch (currentStep) {
      case "dados":
        if (!formData.nome.trim()) newErrors.nome = "Nome é obrigatório";
        break;
      case "contato":
        if (!formData.telefone.trim()) newErrors.telefone = "Telefone é obrigatório";
        break;
      case "endereco":
        if (!formData.bairro.trim()) newErrors.bairro = "Bairro é obrigatório";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    if (isLastStep) {
      // Submeter formulário
      setIsSubmitting(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSubmitting(false);
      setCurrentStep("sucesso");
    } else {
      // Próximo passo
      const nextIndex = currentStepIndex + 1;
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setCurrentStep("dados");
    setErrors({});
  };

  if (isSuccess) {
    return <SuccessScreen onNewCadastro={handleReset} />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <MobileHeader
        title="Novo eleitor"
        showBack
        onBack={() => window.history.back()}
      />

      {/* Progress indicator */}
      <div className="px-4 py-3 border-b border-slate-200 mt-14">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = index < currentStepIndex;

            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => index < currentStepIndex && setCurrentStep(step.id)}
                  disabled={index > currentStepIndex}
                  className={cn(
                    "flex flex-col items-center gap-1",
                    isActive && "text-qg-blue-600",
                    isCompleted && "text-qg-green-600",
                    !isActive && !isCompleted && "text-slate-400"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      isActive && "bg-qg-blue-600 text-white",
                      isCompleted && "bg-qg-green-600 text-white",
                      !isActive && !isCompleted && "bg-slate-200"
                    )}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : step.icon}
                  </div>
                  <span className="text-[10px] font-medium">{step.label}</span>
                </button>

                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-2",
                      index < currentStepIndex ? "bg-qg-green-600" : "bg-slate-200"
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Form content */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentStep === "dados" && (
          <StepDados formData={formData} updateField={updateField} errors={errors} />
        )}
        {currentStep === "contato" && (
          <StepContato formData={formData} updateField={updateField} errors={errors} />
        )}
        {currentStep === "endereco" && (
          <StepEndereco formData={formData} updateField={updateField} errors={errors} />
        )}
        {currentStep === "observacoes" && (
          <StepObservacoes formData={formData} updateField={updateField} />
        )}
      </div>

      {/* Footer com botões */}
      <div className="p-4 border-t border-slate-200 pb-safe">
        <div className="flex gap-3">
          {currentStepIndex > 0 && (
            <button onClick={handleBack} className="btn-secondary flex-1">
              <ChevronLeft className="w-5 h-5" />
              Voltar
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className={cn("btn-primary flex-1", currentStepIndex === 0 && "w-full")}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvando...
              </span>
            ) : isLastStep ? (
              "Cadastrar eleitor"
            ) : (
              "Continuar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 📝 Step Components
// ============================================

interface StepProps {
  formData: FormData;
  updateField: (field: keyof FormData, value: string) => void;
  errors?: Partial<Record<keyof FormData, string>>;
}

function StepDados({ formData, updateField, errors }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <p className="text-lg font-medium text-slate-900 mb-1">Dados pessoais</p>
        <p className="text-sm text-slate-500">Informações básicas do eleitor</p>
      </div>

      {/* Foto (opcional) */}
      <div className="flex justify-center mb-6">
        <button className="relative w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center border-2 border-dashed border-slate-300 active:bg-slate-200">
          <Camera className="w-8 h-8 text-slate-400" />
          <span className="absolute -bottom-1 -right-1 w-8 h-8 bg-qg-blue-600 rounded-full flex items-center justify-center">
            <Camera className="w-4 h-4 text-white" />
          </span>
        </button>
      </div>

      <InputField
        label="Nome completo"
        placeholder="Digite o nome completo"
        value={formData.nome}
        onChange={(v) => updateField("nome", v)}
        error={errors?.nome}
        required
        autoFocus
      />

      <InputField
        label="CPF"
        placeholder="000.000.000-00"
        value={formData.cpf}
        onChange={(v) => updateField("cpf", v)}
        inputMode="numeric"
        mask="cpf"
      />

      <InputField
        label="Data de nascimento"
        placeholder="DD/MM/AAAA"
        value={formData.dataNascimento}
        onChange={(v) => updateField("dataNascimento", v)}
        inputMode="numeric"
        mask="date"
      />
    </div>
  );
}

function StepContato({ formData, updateField, errors }: StepProps) {
  const [sameAsPhone, setSameAsPhone] = React.useState(true);

  React.useEffect(() => {
    if (sameAsPhone && formData.telefone) {
      updateField("whatsapp", formData.telefone);
    }
  }, [formData.telefone, sameAsPhone]);

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <p className="text-lg font-medium text-slate-900 mb-1">Contato</p>
        <p className="text-sm text-slate-500">Como entrar em contato</p>
      </div>

      <InputField
        label="Telefone"
        placeholder="(00) 00000-0000"
        value={formData.telefone}
        onChange={(v) => updateField("telefone", v)}
        error={errors?.telefone}
        inputMode="tel"
        mask="phone"
        required
        autoFocus
      />

      <div>
        <label className="flex items-center gap-3 mb-3">
          <input
            type="checkbox"
            checked={sameAsPhone}
            onChange={(e) => setSameAsPhone(e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 text-qg-blue-600 focus:ring-qg-blue-500"
          />
          <span className="text-sm text-slate-700">WhatsApp é o mesmo número</span>
        </label>

        {!sameAsPhone && (
          <InputField
            label="WhatsApp"
            placeholder="(00) 00000-0000"
            value={formData.whatsapp}
            onChange={(v) => updateField("whatsapp", v)}
            inputMode="tel"
            mask="phone"
          />
        )}
      </div>

      <InputField
        label="E-mail (opcional)"
        placeholder="email@exemplo.com"
        value={formData.email}
        onChange={(v) => updateField("email", v)}
        inputMode="email"
        type="email"
      />
    </div>
  );
}

function StepEndereco({ formData, updateField, errors }: StepProps) {
  const [isLoadingCep, setIsLoadingCep] = React.useState(false);

  const handleCepBlur = async () => {
    const cep = formData.cep.replace(/\D/g, "");
    if (cep.length === 8) {
      setIsLoadingCep(true);
      // Simular busca de CEP
      await new Promise((resolve) => setTimeout(resolve, 800));
      updateField("bairro", "Centro");
      updateField("rua", "Rua das Flores");
      setIsLoadingCep(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <p className="text-lg font-medium text-slate-900 mb-1">Endereço</p>
        <p className="text-sm text-slate-500">Onde o eleitor mora</p>
      </div>

      <InputField
        label="CEP"
        placeholder="00000-000"
        value={formData.cep}
        onChange={(v) => updateField("cep", v)}
        onBlur={handleCepBlur}
        inputMode="numeric"
        mask="cep"
        loading={isLoadingCep}
        autoFocus
      />

      <InputField
        label="Bairro"
        placeholder="Nome do bairro"
        value={formData.bairro}
        onChange={(v) => updateField("bairro", v)}
        error={errors?.bairro}
        required
      />

      <InputField
        label="Rua"
        placeholder="Nome da rua"
        value={formData.rua}
        onChange={(v) => updateField("rua", v)}
      />

      <div className="grid grid-cols-3 gap-3">
        <InputField
          label="Número"
          placeholder="Nº"
          value={formData.numero}
          onChange={(v) => updateField("numero", v)}
          inputMode="numeric"
        />
        <div className="col-span-2">
          <InputField
            label="Complemento"
            placeholder="Apto, bloco..."
            value={formData.complemento}
            onChange={(v) => updateField("complemento", v)}
          />
        </div>
      </div>
    </div>
  );
}

function StepObservacoes({ formData, updateField }: Omit<StepProps, "errors">) {
  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <p className="text-lg font-medium text-slate-900 mb-1">Observações</p>
        <p className="text-sm text-slate-500">Informações adicionais (opcional)</p>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Anotações sobre o eleitor
        </label>
        <textarea
          placeholder="Ex: Conhece a família, indicado por fulano, demanda específica..."
          value={formData.observacoes}
          onChange={(e) => updateField("observacoes", e.target.value)}
          rows={5}
          className="input-touch h-auto resize-none"
        />
        <p className="text-xs text-slate-500 mt-2">
          Essas informações são privadas e só você pode ver
        </p>
      </div>

      {/* Preview do cadastro */}
      <div className="mt-8 p-4 bg-slate-50 rounded-2xl">
        <p className="text-sm font-medium text-slate-700 mb-3">Resumo do cadastro</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Nome:</span>
            <span className="font-medium text-slate-900">{formData.nome || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Telefone:</span>
            <span className="font-medium text-slate-900">{formData.telefone || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Bairro:</span>
            <span className="font-medium text-slate-900">{formData.bairro || "-"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ✅ Success Screen
// ============================================

function SuccessScreen({ onNewCadastro }: { onNewCadastro: () => void }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-20 h-20 bg-qg-green-100 rounded-full flex items-center justify-center mb-6 animate-scale-in">
        <Check className="w-10 h-10 text-qg-green-600" />
      </div>

      <h1 className="text-2xl font-medium text-slate-900 mb-2 text-center">
        Eleitor cadastrado!
      </h1>
      <p className="text-base text-slate-500 text-center mb-8">
        O eleitor foi adicionado à sua base com sucesso.
      </p>

      <div className="w-full max-w-xs space-y-3">
        <button onClick={onNewCadastro} className="btn-primary w-full">
          Cadastrar outro eleitor
        </button>
        <a href="/eleitores" className="btn-secondary w-full block text-center">
          Ver lista de eleitores
        </a>
      </div>
    </div>
  );
}

// ============================================
// 🔤 Input Field Component
// ============================================

interface InputFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  type?: string;
  inputMode?: "text" | "numeric" | "tel" | "email" | "search";
  mask?: "cpf" | "phone" | "cep" | "date";
  loading?: boolean;
  autoFocus?: boolean;
}

function InputField({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  required,
  type = "text",
  inputMode = "text",
  mask,
  loading,
  autoFocus,
}: InputFieldProps) {
  const applyMask = (val: string): string => {
    const digits = val.replace(/\D/g, "");

    switch (mask) {
      case "cpf":
        return digits
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
          .slice(0, 14);
      case "phone":
        return digits
          .replace(/(\d{2})(\d)/, "($1) $2")
          .replace(/(\d{5})(\d)/, "$1-$2")
          .slice(0, 15);
      case "cep":
        return digits.replace(/(\d{5})(\d)/, "$1-$2").slice(0, 9);
      case "date":
        return digits
          .replace(/(\d{2})(\d)/, "$1/$2")
          .replace(/(\d{2})(\d)/, "$1/$2")
          .slice(0, 10);
      default:
        return val;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = mask ? applyMask(e.target.value) : e.target.value;
    onChange(newValue);
  };

  return (
    <div>
      <label className="text-sm font-medium text-slate-700 mb-2 block">
        {label}
        {required && <span className="text-qg-red-600 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          inputMode={inputMode}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          autoFocus={autoFocus}
          className={cn(
            "input-touch",
            error && "border-qg-red-600 focus:border-qg-red-600 focus:ring-qg-red-100"
          )}
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <span className="w-5 h-5 border-2 border-slate-300 border-t-qg-blue-600 rounded-full animate-spin block" />
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-qg-red-600 mt-1 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
}
