import React, { useState } from 'react';
import {
  X,
  Store,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Instagram,
  MessageCircle,
  Share2,
  FileText,
  ShieldCheck,
  CheckCircle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Receipt,
  Eye,
  Save,
} from 'lucide-react';
import {
  DianCompanyInfo,
  DIAN_COMPANY_INFO,
  saveRestaurantInfo,
} from '../utils/colombiaFiscal';

interface RestaurantProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInfo: DianCompanyInfo;
  onSave: (updatedInfo: DianCompanyInfo) => void;
}

export const RestaurantProfileModal: React.FC<RestaurantProfileModalProps> = ({
  isOpen,
  onClose,
  currentInfo,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'ubicacion' | 'redes' | 'dian' | 'preview'>('general');
  const [formData, setFormData] = useState<DianCompanyInfo>({ ...currentInfo });
  const [showSavedToast, setShowSavedToast] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field: keyof DianCompanyInfo, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveRestaurantInfo(formData);
    onSave(formData);
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
      onClose();
    }, 1200);
  };

  const handleResetDefaults = () => {
    if (window.confirm('¿Deseas restaurar la información a los datos sugeridos por defecto de RestoFlow Colombia?')) {
      setFormData({ ...DIAN_COMPANY_INFO });
    }
  };

  // Formato para enlace de WhatsApp
  const cleanWhatsApp = (formData.whatsapp || '').replace(/[^0-9]/g, '');
  const cleanInstagram = (formData.instagram || '').replace('@', '').trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-500 to-rose-500 p-0.5 shadow-lg shadow-orange-500/20">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                <Store className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">
                  Información del Restaurante
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono">
                  DIAN & POS
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Personaliza Nombre, NIT, Dirección, Contactos, Redes Sociales y Parámetros Fiscales
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Saved Toast Feedback */}
        {showSavedToast && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-6 py-2.5 flex items-center gap-2 text-xs font-semibold text-emerald-400 animate-in fade-in">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>¡Información del restaurante guardada con éxito! Se aplicará automáticamente en tickets, facturas y reportes.</span>
          </div>
        )}

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-6 pt-3 pb-2 border-b border-zinc-800 bg-zinc-950/40 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'general'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Datos Generales</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ubicacion')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'ubicacion'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Ubicación y Dirección</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('redes')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'redes'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Redes Sociales</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dian')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'dian'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Facturación DIAN & POS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'preview'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Vista Previa Ticket POS</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* TAB 1: DATOS GENERALES */}
            {activeTab === 'general' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
                  <Store className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-200/90 leading-relaxed">
                    <strong className="text-amber-300 font-semibold block mb-0.5">Identidad Comercial y Razón Social</strong>
                    El <strong>Nombre Comercial</strong> es el nombre que verán tus clientes en el menú, tickets y Navbar. La <strong>Razón Social</strong> es el nombre jurídico registrado ante Cámara de Comercio y la DIAN.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Nombre Comercial del Restaurante *
                    </label>
                    <div className="relative">
                      <Store className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={formData.nombreComercial}
                        onChange={(e) => handleChange('nombreComercial', e.target.value)}
                        placeholder="Ej. RestoFlow Gourmet / Parrilla & Sabor"
                        className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-medium"
                      />
                    </div>
                    <span className="text-[11px] text-zinc-500 mt-1 block">Nombre visible en encabezados y pantallas</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Razón Social Legal (DIAN) *
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={formData.razonSocial}
                        onChange={(e) => handleChange('razonSocial', e.target.value)}
                        placeholder="Ej. RESTOFLOW GASTROBAR S.A.S."
                        className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-medium uppercase"
                      />
                    </div>
                    <span className="text-[11px] text-zinc-500 mt-1 block">Razón social registrada tributariamente</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      NIT de la Empresa *
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <FileText className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={formData.nit}
                          onChange={(e) => handleChange('nit', e.target.value)}
                          placeholder="Ej. 901.784.321"
                          className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono font-bold"
                        />
                      </div>
                      <div className="w-20">
                        <input
                          type="text"
                          maxLength={1}
                          required
                          value={formData.digitoVerificacion}
                          onChange={(e) => handleChange('digitoVerificacion', e.target.value)}
                          placeholder="DV"
                          title="Dígito de Verificación"
                          className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-2 py-2 text-sm text-center text-amber-400 focus:outline-none focus:border-amber-500 font-mono font-bold"
                        />
                      </div>
                    </div>
                    <span className="text-[11px] text-zinc-500 mt-1 block">Número de Identificación Tributaria con DV</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Lema o Eslogan del Restaurante
                    </label>
                    <input
                      type="text"
                      value={formData.eslogan || ''}
                      onChange={(e) => handleChange('eslogan', e.target.value)}
                      placeholder="Ej. Experiencia Gastronómica & Alta Cocina"
                      className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[11px] text-zinc-500 mt-1 block">Frase característica de bienvenida</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800/80">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Teléfono Fijo / PBX
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={formData.telefono}
                        onChange={(e) => handleChange('telefono', e.target.value)}
                        placeholder="Ej. +57 (601) 745-8900"
                        className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Correo de Facturación Electrónica DIAN *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={formData.emailFacturacion}
                        onChange={(e) => handleChange('emailFacturacion', e.target.value)}
                        placeholder="facturacion@restaurante.com"
                        className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Sitio Web Oficial
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={formData.web}
                      onChange={(e) => handleChange('web', e.target.value)}
                      placeholder="www.mirestaurante.com.co"
                      className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: UBICACIÓN Y DIRECCIÓN */}
            {activeTab === 'ubicacion' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="bg-zinc-950/70 border border-zinc-800 p-4 rounded-2xl flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-zinc-300 leading-relaxed">
                    <strong className="text-white font-semibold block mb-0.5">Ubicación del Establecimiento</strong>
                    Esta dirección aparecerá en el encabezado de todas las tirillas de caja, facturas electrónicas y órdenes de comanda para tus clientes y domiciliarios.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Dirección Completa *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={formData.direccion}
                      onChange={(e) => handleChange('direccion', e.target.value)}
                      placeholder="Ej. Carrera 13 # 85-32, Zona Rosa / Chapinero"
                      className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.ciudad}
                      onChange={(e) => handleChange('ciudad', e.target.value)}
                      placeholder="Ej. Bogotá D.C."
                      className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Departamento *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.departamento}
                      onChange={(e) => handleChange('departamento', e.target.value)}
                      placeholder="Ej. Cundinamarca / Antioquia"
                      className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      País
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formData.pais}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-400 font-semibold cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Código Postal (Opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.codigoPostal}
                      onChange={(e) => handleChange('codigoPostal', e.target.value)}
                      placeholder="Ej. 110221"
                      className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: REDES SOCIALES */}
            {activeTab === 'redes' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="bg-gradient-to-r from-pink-500/10 via-amber-500/10 to-emerald-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
                  <Share2 className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-zinc-300 leading-relaxed">
                    <strong className="text-white font-semibold block mb-0.5">Canales Digitales & Redes Sociales</strong>
                    Tus perfiles de WhatsApp, Instagram y redes sociales se imprimirán automáticamente en el pie del ticket para que los clientes te etiqueten, reserven y sigan tus novedades.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* WhatsApp */}
                  <div>
                    <label className="block text-xs font-semibold text-emerald-400 mb-1.5 flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                      WhatsApp (Pedidos / Atención)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.whatsapp || ''}
                        onChange={(e) => handleChange('whatsapp', e.target.value)}
                        placeholder="Ej. +57 310 829-4560"
                        className="flex-1 bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      {cleanWhatsApp && (
                        <a
                          href={`https://wa.me/${cleanWhatsApp}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                          title="Probar enlace de WhatsApp"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Probar</span>
                        </a>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-500 mt-1 block">Número de contacto directo con código de país</span>
                  </div>

                  {/* Instagram */}
                  <div>
                    <label className="block text-xs font-semibold text-pink-400 mb-1.5 flex items-center gap-1.5">
                      <Instagram className="w-4 h-4 text-pink-400" />
                      Instagram (@usuario)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.instagram || ''}
                        onChange={(e) => handleChange('instagram', e.target.value)}
                        placeholder="Ej. @mirestaurante.gourmet"
                        className="flex-1 bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500 font-medium"
                      />
                      {cleanInstagram && (
                        <a
                          href={`https://instagram.com/${cleanInstagram}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                          title="Probar perfil de Instagram"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </a>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-500 mt-1 block">Usuario oficial en Instagram</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Facebook */}
                  <div>
                    <label className="block text-xs font-semibold text-blue-400 mb-1.5 flex items-center gap-1.5">
                      <Share2 className="w-4 h-4 text-blue-400" />
                      Facebook (Página / Perfil)
                    </label>
                    <input
                      type="text"
                      value={formData.facebook || ''}
                      onChange={(e) => handleChange('facebook', e.target.value)}
                      placeholder="Ej. MiRestauranteOficial"
                      className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-[11px] text-zinc-500 mt-1 block">Nombre de página o enlace de Facebook</span>
                  </div>

                  {/* TikTok */}
                  <div>
                    <label className="block text-xs font-semibold text-cyan-400 mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      TikTok (@usuario)
                    </label>
                    <input
                      type="text"
                      value={formData.tiktok || ''}
                      onChange={(e) => handleChange('tiktok', e.target.value)}
                      placeholder="Ej. @mirestaurante"
                      className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-[11px] text-zinc-500 mt-1 block">Perfil de TikTok para videos y recetas</span>
                  </div>
                </div>

                {/* Mensaje personalizado de pie de ticket */}
                <div className="pt-2 border-t border-zinc-800/80">
                  <label className="block text-xs font-semibold text-amber-400 mb-1.5 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-amber-400" />
                    Mensaje de Agradecimiento al Pie del Ticket POS
                  </label>
                  <textarea
                    rows={2}
                    value={formData.mensajeTicket || ''}
                    onChange={(e) => handleChange('mensajeTicket', e.target.value)}
                    placeholder="Ej. ¡Gracias por preferirnos! Etiquétanos en tus fotos con @mirestaurante"
                    className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                  />
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    Texto de despedida impreso al final de cada tirilla de cuenta y factura POS
                  </span>
                </div>
              </div>
            )}

            {/* TAB 4: DATOS FISCALES DIAN */}
            {activeTab === 'dian' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-200/90 leading-relaxed">
                    <strong className="text-amber-300 font-semibold block mb-0.5">Parámetros Tributarios de la DIAN</strong>
                    Configuración de Resolución de Facturación Electrónica y Sistema POS según Resolución DIAN 000165 e Impuesto Nacional al Consumo (INC 8%).
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Número de Resolución DIAN *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.resolucionDianNumero}
                      onChange={(e) => handleChange('resolucionDianNumero', e.target.value)}
                      placeholder="Ej. 18764058291044"
                      className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Fecha de Autorización Resolución *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.resolucionDianFecha}
                      onChange={(e) => handleChange('resolucionDianFecha', e.target.value)}
                      placeholder="DD/MM/AAAA"
                      className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Prefijo Factura
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.prefijoFactura}
                      onChange={(e) => handleChange('prefijoFactura', e.target.value)}
                      placeholder="FE"
                      className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono font-bold uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Prefijo POS
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.prefijoPos}
                      onChange={(e) => handleChange('prefijoPos', e.target.value)}
                      placeholder="POS"
                      className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono font-bold uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Rango Desde
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.rangoDesde}
                      onChange={(e) => handleChange('rangoDesde', Number(e.target.value))}
                      className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Rango Hasta
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.rangoHasta}
                      onChange={(e) => handleChange('rangoHasta', Number(e.target.value))}
                      className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Régimen Tributario
                    </label>
                    <input
                      type="text"
                      value={formData.regimen}
                      onChange={(e) => handleChange('regimen', e.target.value)}
                      className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Actividad Económica CIIU
                    </label>
                    <input
                      type="text"
                      value={formData.codigoActividadCIIU}
                      onChange={(e) => handleChange('codigoActividadCIIU', e.target.value)}
                      placeholder="5611 (Expendio a la mesa de comidas)"
                      className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: VISTA PREVIA EN VIVO */}
            {activeTab === 'preview' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="text-xs text-zinc-400">
                  Así se visualizará la información de tu restaurante en la <strong>Tirilla Térmica POS (80mm)</strong> que reciben tus clientes al pagar en caja:
                </div>

                {/* Ticket Mockup */}
                <div className="max-w-sm mx-auto bg-amber-50/95 text-zinc-900 rounded-2xl p-5 shadow-2xl font-mono text-[11px] border border-amber-200/60 space-y-3 leading-snug">
                  <div className="text-center space-y-0.5">
                    <div className="font-black text-sm uppercase tracking-tight text-zinc-950">
                      {formData.nombreComercial || 'NOMBRE DEL RESTAURANTE'}
                    </div>
                    {formData.eslogan && (
                      <div className="text-[10px] italic text-zinc-600 font-serif">
                        "{formData.eslogan}"
                      </div>
                    )}
                    <div className="text-[10px] text-zinc-700">
                      {formData.razonSocial}
                    </div>
                    <div className="text-[10px] font-bold">
                      NIT: {formData.nit}-{formData.digitoVerificacion}
                    </div>
                    <div className="text-[10px] text-zinc-700">
                      {formData.direccion}
                    </div>
                    <div className="text-[10px] text-zinc-700">
                      {formData.ciudad}, Colombia • Tel: {formData.telefono}
                    </div>
                  </div>

                  <div className="border-t border-b border-dashed border-zinc-400 py-1.5 text-center text-[9px] text-zinc-600">
                    SISTEMA FACTURACIÓN ELECTRÓNICA DIAN<br />
                    Res. DIAN {formData.resolucionDianNumero} del {formData.resolucionDianFecha}<br />
                    Rango: {formData.prefijoFactura}-{formData.rangoDesde} al {formData.prefijoFactura}-{formData.rangoHasta}
                  </div>

                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between font-bold">
                      <span>FACTURA POS: {formData.prefijoPos}-00042</span>
                      <span>MESA #4</span>
                    </div>
                    <div className="flex justify-between text-zinc-600">
                      <span>FECHA: {new Date().toLocaleDateString('es-CO')}</span>
                      <span>13:45</span>
                    </div>
                    <div className="flex justify-between text-zinc-600">
                      <span>CLIENTE: CONSUMIDOR FINAL</span>
                      <span>NIT: 222222222222</span>
                    </div>
                  </div>

                  {/* Sample Items */}
                  <div className="border-t border-zinc-300 pt-1.5 space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span>2x Bandeja Paisa Especial</span>
                      <span className="font-bold">$ 84.000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>2x Limonada de Coco</span>
                      <span className="font-bold">$ 24.000</span>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="border-t border-dashed border-zinc-400 pt-1.5 space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span>Subtotal Alimentos/Bebidas:</span>
                      <span>$ 100.000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Impoconsumo (INC 8%):</span>
                      <span>$ 8.000</span>
                    </div>
                    <div className="flex justify-between text-zinc-700">
                      <span>Propina Voluntaria (10%):</span>
                      <span>$ 10.800</span>
                    </div>
                    <div className="flex justify-between font-black text-xs pt-1 border-t border-zinc-400 text-zinc-950">
                      <span>TOTAL A PAGAR:</span>
                      <span>$ 118.800 COP</span>
                    </div>
                  </div>

                  {/* Footer & Social Media */}
                  <div className="border-t border-zinc-300 pt-2 text-center space-y-1 text-[9px] text-zinc-700">
                    <div className="font-semibold text-zinc-900">
                      {formData.mensajeTicket || '¡Gracias por su compra!'}
                    </div>
                    {(formData.instagram || formData.whatsapp) && (
                      <div className="font-bold text-zinc-900 flex items-center justify-center gap-2 flex-wrap">
                        {formData.instagram && <span>IG: {formData.instagram}</span>}
                        {formData.instagram && formData.whatsapp && <span>•</span>}
                        {formData.whatsapp && <span>WA: {formData.whatsapp}</span>}
                      </div>
                    )}
                    {formData.web && <div>{formData.web}</div>}
                    <div className="text-[8px] text-zinc-500 pt-1">
                      Documento equivalente POS regulado por la DIAN
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 px-6 border-t border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs text-zinc-400 hover:text-rose-400 flex items-center gap-1.5 transition order-2 sm:order-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer valores iniciales</span>
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
