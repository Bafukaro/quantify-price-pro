// AUTO-GERADO a partir de price_database_multisupplier.csv (multi-fornecedor)
// e Ferragem_RFQ_Priced.xlsx (catálogo alargado). Preços exactos, sem arredondamento.
import type { Material, Supplier } from "./priceDb";

export const importedSuppliers: Supplier[] = [
  { id: "s-somofer", name: "Somofer", type: "formal", location: "Maputo", rating: 4.5 },
  { id: "s-ferragens-polana", name: "Ferragens Polana", type: "formal", location: "Maputo", rating: 4.3 },
  { id: "s-kangela-builders", name: "Kangela/Builders", type: "formal", location: "Maputo", rating: 4.2 },
  { id: "s-socin-lda", name: "SOCIN LDA", type: "formal", location: "Lichinga", rating: 4.0 },
  { id: "s-safira-mozambique-ceramic", name: "Safira Mozambique Ceramic", type: "formal", location: "Maputo", rating: 4.1 },
  { id: "s-mercado-maputo-estimado", name: "Mercado Maputo — estimado", type: "informal", location: "Maputo", rating: 3.0 },
];

export const importedMaterials: Material[] = [
  {
    id: "m-cimento-42-5n-saco-50kg", name: "Cimento 42,5N (saco 50kg)", unit: "saco", category: "Cimento",
    quotes: [
      { supplierId: "s-somofer", price: 425.0, date: "2026-04-14", city: "Maputo", note: "Limak" },
      { supplierId: "s-ferragens-polana", price: 425.0, date: "2026-04-14", city: "Maputo", note: "Limak" },
      { supplierId: "s-kangela-builders", price: 425.0, date: "2026-01-04", city: "Maputo", note: "Nacional" },
      { supplierId: "s-socin-lda", price: 500.0, date: "2026 (board)", city: "Lichinga", note: "Búfalo" },
    ],
  },
  {
    id: "m-cimento-32-5n-saco-50kg", name: "Cimento 32,5N (saco 50kg)", unit: "saco", category: "Cimento",
    quotes: [
      { supplierId: "s-somofer", price: 393.0, date: "2026-04-14", city: "Maputo", note: "Yaobai" },
      { supplierId: "s-kangela-builders", price: 413.0, date: "2026-01-04", city: "Maputo", note: "P" },
      { supplierId: "s-socin-lda", price: 490.0, date: "2026 (board)", city: "Lichinga", note: "Elefante" },
      { supplierId: "s-socin-lda", price: 450.0, date: "2026 (board)", city: "Lichinga", note: "Búfalo" },
    ],
  },
  {
    id: "m-varao-nervurado-6mm", name: "Varão nervurado Ø6mm", unit: "barra", category: "Ferro",
    quotes: [
      { supplierId: "s-somofer", price: 124.0, date: "2026-04-14", city: "Maputo" },
      { supplierId: "s-ferragens-polana", price: 126.0, date: "2026-04-14", city: "Maputo" },
      { supplierId: "s-kangela-builders", price: 110.0, date: "2026-01-04", city: "Maputo" },
      { supplierId: "s-socin-lda", price: 95.0, date: "2026 (board)", city: "Lichinga" },
    ],
  },
  {
    id: "m-varao-nervurado-8mm", name: "Varão nervurado Ø8mm", unit: "barra", category: "Ferro",
    quotes: [
      { supplierId: "s-somofer", price: 190.0, date: "2026-04-14", city: "Maputo" },
      { supplierId: "s-ferragens-polana", price: 192.0, date: "2026-04-14", city: "Maputo" },
      { supplierId: "s-kangela-builders", price: 170.0, date: "2026-01-04", city: "Maputo" },
      { supplierId: "s-socin-lda", price: 140.0, date: "2026 (board)", city: "Lichinga" },
    ],
  },
  {
    id: "m-varao-nervurado-10mm", name: "Varão nervurado Ø10mm", unit: "barra", category: "Ferro",
    quotes: [
      { supplierId: "s-somofer", price: 295.0, date: "2026-04-14", city: "Maputo" },
      { supplierId: "s-ferragens-polana", price: 297.0, date: "2026-04-14", city: "Maputo" },
      { supplierId: "s-kangela-builders", price: 269.0, date: "2026-01-04", city: "Maputo" },
      { supplierId: "s-socin-lda", price: 200.0, date: "2026 (board)", city: "Lichinga" },
    ],
  },
  {
    id: "m-varao-nervurado-12mm", name: "Varão nervurado Ø12mm", unit: "barra", category: "Ferro",
    quotes: [
      { supplierId: "s-somofer", price: 389.0, date: "2026-04-14", city: "Maputo" },
      { supplierId: "s-kangela-builders", price: 345.0, date: "2026-01-04", city: "Maputo" },
      { supplierId: "s-socin-lda", price: 310.0, date: "2026 (board)", city: "Lichinga" },
    ],
  },
  {
    id: "m-varao-nervurado-16mm", name: "Varão nervurado Ø16mm", unit: "barra", category: "Ferro",
    quotes: [
      { supplierId: "s-somofer", price: 689.0, date: "2026-04-14", city: "Maputo" },
      { supplierId: "s-kangela-builders", price: 648.0, date: "2026-01-04", city: "Maputo" },
    ],
  },
  {
    id: "m-tubo-pvc-pressao-75mm-6m", name: "Tubo PVC pressão Ø75mm (6m)", unit: "peça", category: "PVC",
    quotes: [
      { supplierId: "s-somofer", price: 1575.0, date: "2026-04-14", city: "Maputo" },
      { supplierId: "s-ferragens-polana", price: 1575.0, date: "2026-04-14", city: "Maputo" },
      { supplierId: "s-socin-lda", price: 675.0, date: "2026 (board)", city: "Lichinga" },
    ],
  },
  {
    id: "m-tubo-pvc-pressao-110mm-6m", name: "Tubo PVC pressão Ø110mm (6m)", unit: "peça", category: "PVC",
    quotes: [
      { supplierId: "s-somofer", price: 2635.0, date: "2026-04-14", city: "Maputo" },
      { supplierId: "s-ferragens-polana", price: 2635.0, date: "2026-04-14", city: "Maputo" },
      { supplierId: "s-socin-lda", price: 850.0, date: "2026 (board)", city: "Lichinga" },
    ],
  },
  {
    id: "m-fio-electrico-pbt-2-5mm2-m", name: "Fio eléctrico PBT 2.5mm² (m)", unit: "m", category: "Eléctrica",
    quotes: [
      { supplierId: "s-socin-lda", price: 40.0, date: "2026-02-06", city: "Lichinga", note: "por metro" },
      { supplierId: "s-ferragens-polana", price: 49.5, date: "2026-04-14", city: "Maputo", note: "por metro" },
    ],
  },
  {
    id: "m-fio-electrico-pbt-1-5mm2-m", name: "Fio eléctrico PBT 1.5mm² (m)", unit: "m", category: "Eléctrica",
    quotes: [
      { supplierId: "s-socin-lda", price: 30.0, date: "2026-02-06", city: "Lichinga", note: "por metro" },
      { supplierId: "s-ferragens-polana", price: 31.5, date: "2026-04-14", city: "Maputo", note: "por metro" },
    ],
  },
  {
    id: "m-tinta-pva-interior-20l-true-colour", name: "Tinta PVA interior 20L (True Colour)", unit: "balde", category: "Tintas",
    quotes: [
      { supplierId: "s-kangela-builders", price: 1700.0, date: "2026-01-04", city: "Maputo", note: "True Colour" },
    ],
  },
  {
    id: "m-tinta-pva-interior-20l-citycoat", name: "Tinta PVA interior 20L (Citycoat)", unit: "balde", category: "Tintas",
    quotes: [
      { supplierId: "s-kangela-builders", price: 1450.0, date: "2026-01-04", city: "Maputo", note: "Citycoat" },
    ],
  },
  {
    id: "m-tinta-exterior-acrilica-20l-f-earth", name: "Tinta exterior acrílica 20L (F/Earth)", unit: "balde", category: "Tintas",
    quotes: [
      { supplierId: "s-kangela-builders", price: 4250.0, date: "2026-01-04", city: "Maputo", note: "F/Earth" },
    ],
  },
  {
    id: "m-tinta-exterior-acrilica-20l-plascon-polvin", name: "Tinta exterior acrílica 20L (Plascon Polvin)", unit: "balde", category: "Tintas",
    quotes: [
      { supplierId: "s-kangela-builders", price: 4655.0, date: "2026-01-04", city: "Maputo", note: "Plascon Polvin" },
    ],
  },
  {
    id: "m-areia-de-rio-lavada", name: "Areia de rio lavada", unit: "m³", category: "Construção",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 1800.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-areia-fina-para-reboco", name: "Areia fina para reboco", unit: "m³", category: "Construção",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 1600.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-brita-13-mm", name: "Brita 13 mm", unit: "m³", category: "Construção",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 2200.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-brita-19-mm", name: "Brita 19 mm", unit: "m³", category: "Construção",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 2100.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-po-de-pedra", name: "Pó de pedra", unit: "m³", category: "Construção",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 1400.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-tijolo-comum-argila", name: "Tijolo comum (argila)", unit: "milheiro", category: "Construção",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 9500.0, date: "2026-04-14", city: "Maputo", note: "Estimado – ancorado em tijolo cerâmico Kangela" },
    ],
  },
  {
    id: "m-bloco-de-cimento-190190390-200-mm", name: "Bloco de cimento 190×190×390 (200 mm)", unit: "un", category: "Construção",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 60.0, date: "2026-04-14", city: "Maputo", note: "Estimado – ancorado em bloco M90 Kangela" },
    ],
  },
  {
    id: "m-bloco-de-cimento-140-mm", name: "Bloco de cimento 140 mm", unit: "un", category: "Construção",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 45.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-maxibrick", name: "Maxibrick", unit: "un", category: "Construção",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 20.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-cinta-asfaltica-dpc-375-mm-rolo", name: "Cinta asfáltica DPC 375 mm (rolo)", unit: "rolo", category: "Construção",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 950.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-manta-plastica-250-micron-fundacao", name: "Manta plástica 250 mícron (fundação)", unit: "rolo", category: "Construção",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 1200.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-viga-pre-moldada-lintel-1-22-4-m", name: "Viga pré-moldada/lintel 1,2–2,4 m", unit: "un", category: "Construção",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 450.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-arame-recozido-para-atilho", name: "Arame recozido para atilho", unit: "kg", category: "Construção",
    quotes: [
      { supplierId: "s-kangela-builders", price: 120.0, date: "2026-04-14", city: "Maputo", note: "Real – Kangela (arame 1.6mm/5kg ÷5)" },
    ],
  },
  {
    id: "m-malha-electrosoldada-a142-a193", name: "Malha electrosoldada A142/A193", unit: "m²", category: "Construção",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 180.0, date: "2026-04-14", city: "Maputo", note: "Estimado – ancorado em malha soldada Kangela" },
    ],
  },
  {
    id: "m-trelica-bricksforce-75-150-mm-rolo", name: "Treliça/Bricksforce 75/150 mm (rolo)", unit: "m", category: "Construção",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 35.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-madeira-estrutural-pinho-3876-38114", name: "Madeira estrutural (pinho) 38×76 / 38×114", unit: "m", category: "Madeira",
    quotes: [
      { supplierId: "s-kangela-builders", price: 150.0, date: "2026-04-14", city: "Maputo", note: "Real – Kangela (madeira pinho ÷6.6m)" },
    ],
  },
  {
    id: "m-contraplacado-18-mm-folheado", name: "Contraplacado 18 mm (folheado)", unit: "folha", category: "Madeira",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 3200.0, date: "2026-04-14", city: "Maputo", note: "Estimado – ancorado em chapas contraplacadas SOCIN" },
    ],
  },
  {
    id: "m-osb3-11-mm", name: "OSB3 11 mm", unit: "folha", category: "Madeira",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 2200.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-mdf-16-mm", name: "MDF 16 mm", unit: "folha", category: "Madeira",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 2500.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-aglomerado-chipboard-16-mm", name: "Aglomerado (chipboard) 16 mm", unit: "folha", category: "Madeira",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 1900.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-rodape-mdf-70-mm", name: "Rodapé MDF 70 mm", unit: "m", category: "Madeira",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 180.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-marco-de-porta-madeira-dura", name: "Marco de porta (madeira dura)", unit: "un", category: "Madeira",
    quotes: [
      { supplierId: "s-kangela-builders", price: 3200.0, date: "2026-04-14", city: "Maputo", note: "Real – Kangela (moldura porta dupla)" },
    ],
  },
  {
    id: "m-chapa-zincada-ondulada-0-470-53-mm", name: "Chapa zincada ondulada 0,47–0,53 mm", unit: "m²", category: "Coberturas",
    quotes: [
      { supplierId: "s-kangela-builders", price: 380.0, date: "2026-04-14", city: "Maputo", note: "Real-informado – ancorado em IBR Kangela" },
    ],
  },
  {
    id: "m-chapa-ibr-0-5-mm", name: "Chapa IBR 0,5 mm", unit: "m²", category: "Coberturas",
    quotes: [
      { supplierId: "s-kangela-builders", price: 385.0, date: "2026-04-14", city: "Maputo", note: "Real – Kangela (IBR 0.47mm)" },
    ],
  },
  {
    id: "m-cumeeira-rufos", name: "Cumeeira & rufos", unit: "m", category: "Coberturas",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 450.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-subcobertura-sisalation", name: "Subcobertura (sisalation)", unit: "m²", category: "Coberturas",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 120.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-isolamento-termico-50100-mm", name: "Isolamento térmico 50–100 mm", unit: "m²", category: "Coberturas",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 280.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-parafusos-para-cobertura", name: "Parafusos para cobertura", unit: "cx", category: "Coberturas",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 650.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-calhas-gutter-prepintadas", name: "Calhas (gutter) pré‑pintadas", unit: "m", category: "Coberturas",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 550.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-condutores-verticais-downpipes-suportes", name: "Condutores verticais (downpipes) + suportes", unit: "m", category: "Coberturas",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 480.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-placa-de-gesso-12-5-mm-1-22-4-m", name: "Placa de gesso 12,5 mm (1,2×2,4 m)", unit: "folha", category: "Drywall",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 1350.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-massa-de-juntas-skim", name: "Massa de juntas/skim", unit: "saco", category: "Drywall",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 450.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-fita-para-juntas-rolo", name: "Fita para juntas (rolo)", unit: "rolo", category: "Drywall",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 180.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-cornija-eps-pvc", name: "Cornija (EPS/PVC)", unit: "m", category: "Drywall",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 120.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
      { supplierId: "s-ferragens-polana", price: 128.0, date: "2026-08-20", city: "Maputo", note: "Levantamento Ago/2026" },
      { supplierId: "s-kangela-builders", price: 135.0, date: "2026-08-20", city: "Maputo", note: "Levantamento Ago/2026" },
    ],
  },
  {
    id: "m-estrutura-t-bar-placas-minerais", name: "Estrutura T-bar + placas minerais", unit: "m²", category: "Drywall",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 950.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-ripas-barrotes-para-tecto-madeira", name: "Ripas/Barrotes para tecto (madeira)", unit: "m", category: "Drywall",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 110.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
      { supplierId: "s-ferragens-polana", price: 118.0, date: "2026-08-20", city: "Maputo", note: "Levantamento Ago/2026" },
      { supplierId: "s-kangela-builders", price: 125.0, date: "2026-08-20", city: "Maputo", note: "Levantamento Ago/2026" },
    ],
  },
  {
    id: "m-manta-betuminosa-torch-on-4-mm-app", name: "Manta betuminosa torch-on 4 mm (APP)", unit: "m²", category: "Impermeabilização",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 650.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
      { supplierId: "s-ferragens-polana", price: 695.0, date: "2026-08-20", city: "Maputo", note: "Levantamento Ago/2026" },
      { supplierId: "s-kangela-builders", price: 710.0, date: "2026-08-20", city: "Maputo", note: "Levantamento Ago/2026" },
    ],
  },
  {
    id: "m-primario-betuminoso", name: "Primário betuminoso", unit: "L", category: "Impermeabilização",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 280.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
      { supplierId: "s-ferragens-polana", price: 298.0, date: "2026-08-20", city: "Maputo", note: "Levantamento Ago/2026" },
      { supplierId: "s-kangela-builders", price: 310.0, date: "2026-08-20", city: "Maputo", note: "Levantamento Ago/2026" },
    ],
  },
  {
    id: "m-impermeabilizante-acrilico-balde-20-l", name: "Impermeabilizante acrílico (balde 20 L)", unit: "balde", category: "Impermeabilização",
    quotes: [
      { supplierId: "s-somofer", price: 6900.0, date: "2026-04-14", city: "Maputo", note: "Real-informado – ancorado em Multiseal Plascon Somofer" },
      { supplierId: "s-ferragens-polana", price: 7200.0, date: "2026-08-20", city: "Maputo", note: "Levantamento Ago/2026" },
      { supplierId: "s-kangela-builders", price: 7450.0, date: "2026-08-20", city: "Maputo", note: "Levantamento Ago/2026" },
    ],
  },
  {
    id: "m-selante-silicone-neutro-cartucho", name: "Selante silicone neutro (cartucho)", unit: "cartucho", category: "Impermeabilização",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 350.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
      { supplierId: "s-ferragens-polana", price: 370.0, date: "2026-08-20", city: "Maputo", note: "Levantamento Ago/2026" },
      { supplierId: "s-kangela-builders", price: 390.0, date: "2026-08-20", city: "Maputo", note: "Levantamento Ago/2026" },
    ],
  },
  {
    id: "m-selante-pu-cartucho", name: "Selante PU (cartucho)", unit: "cartucho", category: "Impermeabilização",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 420.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
      { supplierId: "s-ferragens-polana", price: 445.0, date: "2026-08-20", city: "Maputo", note: "Levantamento Ago/2026" },
      { supplierId: "s-kangela-builders", price: 468.0, date: "2026-08-20", city: "Maputo", note: "Levantamento Ago/2026" },
    ],
  },
  {
    id: "m-espuma-expansiva-pu", name: "Espuma expansiva PU", unit: "lata", category: "Impermeabilização",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 550.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
      { supplierId: "s-ferragens-polana", price: 585.0, date: "2026-08-20", city: "Maputo", note: "Levantamento Ago/2026" },
      { supplierId: "s-kangela-builders", price: 610.0, date: "2026-08-20", city: "Maputo", note: "Levantamento Ago/2026" },
    ],
  },
  {
    id: "m-undercoat-primario-universal-520-l", name: "Undercoat/primário universal (5–20 L)", unit: "L", category: "Tintas",
    quotes: [
      { supplierId: "s-kangela-builders", price: 1400.0, date: "2026-04-14", city: "Maputo", note: "Real-informado – ancorado em Sotinco Kangela" },
    ],
  },
  {
    id: "m-esmalte-sintetico-brilhante-5-l", name: "Esmalte sintético brilhante (5 L)", unit: "L", category: "Tintas",
    quotes: [
      { supplierId: "s-somofer", price: 2495.0, date: "2026-04-14", city: "Maputo", note: "Real – Somofer" },
    ],
  },
  {
    id: "m-primario-anticorrosivo-metal-5-l", name: "Primário anticorrosivo (metal) (5 L)", unit: "L", category: "Tintas",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 1800.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-thinners-aguarras-5-l", name: "Thinners / aguarrás (5 L)", unit: "L", category: "Tintas",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 650.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-pinceis-variados", name: "Pincéis variados", unit: "un", category: "Tintas",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 85.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-rolos-tabuleiro-kit", name: "Rolos + tabuleiro (kit)", unit: "kit", category: "Tintas",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 450.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-fita-de-mascarar-48-mm", name: "Fita de mascarar 48 mm", unit: "rolo", category: "Tintas",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 95.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-lonas-de-protecao", name: "Lonas de proteção", unit: "un", category: "Tintas",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 180.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-azulejo-ceramico-parede", name: "Azulejo cerâmico (parede)", unit: "m²", category: "Pavimentos",
    quotes: [
      { supplierId: "s-safira-mozambique-ceramic", price: 406.0, date: "2026-04-14", city: "Maputo", note: "Real – Safira Mozambique Ceramic" },
    ],
  },
  {
    id: "m-porcelanato-600600", name: "Porcelanato 600×600", unit: "m²", category: "Pavimentos",
    quotes: [
      { supplierId: "s-safira-mozambique-ceramic", price: 656.0, date: "2026-04-14", city: "Maputo", note: "Real – Safira Mozambique Ceramic" },
    ],
  },
  {
    id: "m-cimento-cola-c1-c2-2025-kg", name: "Cimento cola C1/C2 (20–25 kg)", unit: "saco", category: "Pavimentos",
    quotes: [
      { supplierId: "s-kangela-builders", price: 175.0, date: "2026-04-14", city: "Maputo", note: "Real – Kangela" },
    ],
  },
  {
    id: "m-betume-junta-para-azulejo", name: "Betume/junta para azulejo", unit: "kg", category: "Pavimentos",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 140.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-espacadores-para-azulejo", name: "Espaçadores para azulejo", unit: "saq", category: "Pavimentos",
    quotes: [
      { supplierId: "s-kangela-builders", price: 280.0, date: "2026-04-14", city: "Maputo", note: "Real – Kangela (tal espaçadora)" },
    ],
  },
  {
    id: "m-perfil-remocao-de-acabamento-aluminio", name: "Perfil/remoção de acabamento alumínio", unit: "m", category: "Pavimentos",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 220.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-porta-alveolar-hollow-core-8132032", name: "Porta alveolar (hollow core) 813×2032", unit: "un", category: "Portas & Janelas",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 4500.0, date: "2026-04-14", city: "Maputo", note: "Estimado – ancorado em porta maciça Kangela" },
    ],
  },
  {
    id: "m-porta-macica-solid-core-8132032", name: "Porta maciça (solid core) 813×2032", unit: "un", category: "Portas & Janelas",
    quotes: [
      { supplierId: "s-kangela-builders", price: 13500.0, date: "2026-04-14", city: "Maputo", note: "Real – Kangela" },
    ],
  },
  {
    id: "m-aro-marco-metalico-para-porta", name: "Aro/Marco metálico para porta", unit: "un", category: "Portas & Janelas",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 2800.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-fechadura-embutir-2-3-alavancas", name: "Fechadura embutir 2/3 alavancas", unit: "un", category: "Portas & Janelas",
    quotes: [
      { supplierId: "s-kangela-builders", price: 640.0, date: "2026-04-14", city: "Maputo", note: "Real – Kangela (Elephant)" },
    ],
  },
  {
    id: "m-conjunto-puxador-roseta", name: "Conjunto puxador/roseta", unit: "conj", category: "Portas & Janelas",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 450.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-dobradicas-inox-100-mm-par", name: "Dobradiças inox 100 mm (par)", unit: "par", category: "Portas & Janelas",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 350.0, date: "2026-04-14", city: "Maputo", note: "Estimado – ancorado em Dortello Kangela" },
    ],
  },
  {
    id: "m-mola-aerea-para-porta", name: "Mola aérea para porta", unit: "un", category: "Portas & Janelas",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 1800.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-cadeado-50-mm", name: "Cadeado 50 mm", unit: "un", category: "Portas & Janelas",
    quotes: [
      { supplierId: "s-kangela-builders", price: 650.0, date: "2026-04-14", city: "Maputo", note: "Real-informado – Builders/Kangela" },
    ],
  },
  {
    id: "m-eletroduto-pvc-20-25-mm-acessorios", name: "Eletroduto PVC 20/25 mm + acessórios", unit: "m", category: "Eléctrica",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 85.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-cabo-cobre-4-mm2", name: "Cabo cobre 4 mm²", unit: "m", category: "Eléctrica",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 65.0, date: "2026-04-14", city: "Maputo", note: "Estimado – extrapolado de dados SOCIN" },
    ],
  },
  {
    id: "m-calha-tomada-de-cabo-trunking", name: "Calha/tomada de cabo (trunking)", unit: "m", category: "Eléctrica",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 180.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-quadro-eletrico-8-12-vias", name: "Quadro elétrico 8/12 vias", unit: "un", category: "Eléctrica",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 2800.0, date: "2026-04-14", city: "Maputo", note: "Estimado – ancorado em quadro 16mod Kangela" },
    ],
  },
  {
    id: "m-disjuntores-mcb-6-10-20-a", name: "Disjuntores MCB 6/10/20 A", unit: "un", category: "Eléctrica",
    quotes: [
      { supplierId: "s-kangela-builders", price: 430.0, date: "2026-04-14", city: "Maputo", note: "Real – média SOCIN/Kangela" },
    ],
  },
  {
    id: "m-interruptor-1-tecla", name: "Interruptor 1 tecla", unit: "un", category: "Eléctrica",
    quotes: [
      { supplierId: "s-socin-lda", price: 210.0, date: "2026-04-14", city: "Lichinga", note: "Real – SOCIN (Wesa simples)" },
    ],
  },
  {
    id: "m-tomada-16-a", name: "Tomada 16 A", unit: "un", category: "Eléctrica",
    quotes: [
      { supplierId: "s-socin-lda", price: 240.0, date: "2026-04-14", city: "Lichinga", note: "Real – SOCIN (Wesa c/terra)" },
    ],
  },
  {
    id: "m-lampada-led-912-w", name: "Lâmpada LED 9–12 W", unit: "un", category: "Eléctrica",
    quotes: [
      { supplierId: "s-kangela-builders", price: 175.0, date: "2026-04-14", city: "Maputo", note: "Real – Kangela (Philips 11W)" },
    ],
  },
  {
    id: "m-projetor-led-exterior-50-w", name: "Projetor LED exterior 50 W", unit: "un", category: "Eléctrica",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 1450.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-diferencial-rcd-30-ma", name: "Diferencial/RCD 30 mA", unit: "un", category: "Eléctrica",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 950.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-tubo-pvc-pressao-pn10-dn20dn50", name: "Tubo PVC pressão PN10 DN20–DN50", unit: "m", category: "Canalizações",
    quotes: [
      { supplierId: "s-somofer", price: 110.0, date: "2026-04-14", city: "Maputo", note: "Real – Somofer (Tubo 50mm ÷6m)" },
    ],
  },
  {
    id: "m-tubo-esgoto-pvc-sn4-dn110", name: "Tubo esgoto PVC SN4 DN110", unit: "m", category: "Canalizações",
    quotes: [
      { supplierId: "s-somofer", price: 439.0, date: "2026-04-14", city: "Maputo", note: "Real – Somofer/Polana (Tubo 110mm ÷6m)" },
    ],
  },
  {
    id: "m-tubo-ppr-pn20-dn20dn63", name: "Tubo PPR PN20 DN20–DN63", unit: "m", category: "Canalizações",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 95.0, date: "2026-04-14", city: "Maputo", note: "Estimado – ancorado em SOCIN Tubo PPR" },
    ],
  },
  {
    id: "m-acessorios-pvc-ppr-joelho-t-luva", name: "Acessórios PVC/PPR (joelho, T, luva)", unit: "conj", category: "Canalizações",
    quotes: [
      { supplierId: "s-kangela-builders", price: 40.0, date: "2026-04-14", city: "Maputo", note: "Real – Kangela (média União/Joelho/Tê)" },
    ],
  },
  {
    id: "m-valvula-de-esfera-1-2-1", name: "Válvula de esfera 1/2\"–1\"", unit: "un", category: "Canalizações",
    quotes: [
      { supplierId: "s-kangela-builders", price: 950.0, date: "2026-04-14", city: "Maputo", note: "Real – Kangela" },
    ],
  },
  {
    id: "m-valvula-de-gaveta-1", name: "Válvula de gaveta 1\"", unit: "un", category: "Canalizações",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 850.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-torneira-misturadora-de-lavatorio", name: "Torneira/misturadora de lavatório", unit: "un", category: "Canalizações",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 2200.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-conjunto-duche-c-misturadora", name: "Conjunto duche c/ misturadora", unit: "un", category: "Canalizações",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 3800.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-sanita-completa-c-descarga", name: "Sanita completa (c/ descarga)", unit: "un", category: "Canalizações",
    quotes: [
      { supplierId: "s-kangela-builders", price: 5200.0, date: "2026-04-14", city: "Maputo", note: "Real – Kangela" },
    ],
  },
  {
    id: "m-lavatorio-de-parede-coluna", name: "Lavatório de parede/coluna", unit: "un", category: "Canalizações",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 2600.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-aquecedor-de-agua-50100-l", name: "Aquecedor de água 50–100 L", unit: "un", category: "Canalizações",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 5800.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-fita-vedarosca-ptfe", name: "Fita veda‑rosca PTFE", unit: "rolo", category: "Canalizações",
    quotes: [
      { supplierId: "s-kangela-builders", price: 50.0, date: "2026-04-14", city: "Maputo", note: "Real – Kangela" },
    ],
  },
  {
    id: "m-cola-pvc-500-ml", name: "Cola PVC (500 ml)", unit: "un", category: "Canalizações",
    quotes: [
      { supplierId: "s-ferragens-polana", price: 570.0, date: "2026-04-14", city: "Maputo", note: "Real-informado – Ferragens Polana (250ml ×2)" },
    ],
  },
  {
    id: "m-prego-75-mm", name: "Prego 75 mm", unit: "kg", category: "Ferragens",
    quotes: [
      { supplierId: "s-kangela-builders", price: 115.0, date: "2026-04-14", city: "Maputo", note: "Real – Kangela" },
    ],
  },
  {
    id: "m-parafusos-chipboard-450-cx", name: "Parafusos chipboard 4×50 (cx)", unit: "cx", category: "Ferragens",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 380.0, date: "2026-04-14", city: "Maputo", note: "Estimado – ancorado em Kangela" },
    ],
  },
  {
    id: "m-parafusos-cabeca-sextavada-m10100", name: "Parafusos cabeça sextavada M10×100", unit: "cx", category: "Ferragens",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 650.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-parafusos-porcas-arruelas-m8m12", name: "Parafusos/porcas/arruelas M8–M12", unit: "kg", category: "Ferragens",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 320.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-bucha-e-parafuso-para-alvenaria", name: "Bucha e parafuso para alvenaria", unit: "cx", category: "Ferragens",
    quotes: [
      { supplierId: "s-kangela-builders", price: 250.0, date: "2026-04-14", city: "Maputo", note: "Real – Kangela" },
    ],
  },
  {
    id: "m-ancoragem-quimica-cartucho", name: "Ancoragem química (cartucho)", unit: "cartucho", category: "Ferragens",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 980.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-parafuso-de-ancoragem-m12", name: "Parafuso de ancoragem M12", unit: "un", category: "Ferragens",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 85.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-fita-vedante-butilica", name: "Fita vedante butílica", unit: "rolo", category: "Ferragens",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 320.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-rebarbadora-esmeril-115-mm", name: "Rebarbadora/Esmeril 115 mm", unit: "un", category: "Ferramentas",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 4200.0, date: "2026-04-14", city: "Maputo", note: "Estimado – ancorado em Bosch Kangela (c/disco)" },
    ],
  },
  {
    id: "m-martelo-perfurador-sds", name: "Martelo perfurador SDS+", unit: "un", category: "Ferramentas",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 5800.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-berbequim-parafusadora-sem-fio", name: "Berbequim/parafusadora sem fio", unit: "un", category: "Ferramentas",
    quotes: [
      { supplierId: "s-kangela-builders", price: 1950.0, date: "2026-04-14", city: "Maputo", note: "Real – Kangela (Ryobi broquim)" },
    ],
  },
  {
    id: "m-serra-circular-manual", name: "Serra circular manual", unit: "un", category: "Ferramentas",
    quotes: [
      { supplierId: "s-kangela-builders", price: 4200.0, date: "2026-04-14", city: "Maputo", note: "Real – Kangela (Ryobi 1250W)" },
    ],
  },
  {
    id: "m-nivel-de-bolha-1200-mm", name: "Nível de bolha 1200 mm", unit: "un", category: "Ferramentas",
    quotes: [
      { supplierId: "s-kangela-builders", price: 3800.0, date: "2026-04-14", city: "Maputo", note: "Real-informado – Kangela (Stabila 80cm)" },
    ],
  },
  {
    id: "m-fita-metrica-8-m", name: "Fita métrica 8 m", unit: "un", category: "Ferramentas",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 250.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-colher-de-pedreiro-talocha", name: "Colher de pedreiro / talocha", unit: "un", category: "Ferramentas",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 180.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-pa-quadrada-pa-de-bico", name: "Pá quadrada / pá de bico", unit: "un", category: "Ferramentas",
    quotes: [
      { supplierId: "s-kangela-builders", price: 1200.0, date: "2026-04-14", city: "Maputo", note: "Real – Kangela (B/Pride)" },
    ],
  },
  {
    id: "m-picareta", name: "Picareta", unit: "un", category: "Ferramentas",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 650.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-carrinho-de-mao-construcao", name: "Carrinho de mão (construção)", unit: "un", category: "Ferramentas",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 3200.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-escada-3-m", name: "Escada 3 m", unit: "un", category: "Ferramentas",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 2800.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-extensao-eletrica-20-m", name: "Extensão elétrica 20 m", unit: "un", category: "Ferramentas",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 950.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-gerador-5-kva-opcional", name: "Gerador 5 kVA (opcional)", unit: "un", category: "Ferramentas",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 55000.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-capacete-de-seguranca", name: "Capacete de segurança", unit: "un", category: "Segurança & EPI",
    quotes: [
      { supplierId: "s-kangela-builders", price: 150.0, date: "2026-04-14", city: "Maputo", note: "Real – Kangela" },
    ],
  },
  {
    id: "m-colete-refletor", name: "Colete refletor", unit: "un", category: "Segurança & EPI",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 350.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-botas-de-seguranca-par", name: "Botas de segurança (par)", unit: "par", category: "Segurança & EPI",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 1800.0, date: "2026-04-14", city: "Maputo", note: "Estimado – ancorado em bota soldador Kangela" },
    ],
  },
  {
    id: "m-oculos-de-protecao", name: "Óculos de proteção", unit: "un", category: "Segurança & EPI",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 180.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-luvas-nitrilicas-couro", name: "Luvas (nitrílicas/couro)", unit: "par", category: "Segurança & EPI",
    quotes: [
      { supplierId: "s-kangela-builders", price: 225.0, date: "2026-04-14", city: "Maputo", note: "Real – Kangela (Pioneer flex)" },
    ],
  },
  {
    id: "m-protecao-auditiva-orelhas", name: "Proteção auditiva (orelhas)", unit: "par", category: "Segurança & EPI",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 220.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-mascaras-ffp2-n95-cx", name: "Máscaras FFP2/N95 (cx)", unit: "cx", category: "Segurança & EPI",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 2600.0, date: "2026-04-14", city: "Maputo", note: "Estimado – ancorado em Kangela (unid. ×20)" },
    ],
  },
  {
    id: "m-fita-de-advertencia-zebrada", name: "Fita de advertência (zebrada)", unit: "rolo", category: "Segurança & EPI",
    quotes: [
      { supplierId: "s-kangela-builders", price: 950.0, date: "2026-04-14", city: "Maputo", note: "Real – Kangela" },
    ],
  },
  {
    id: "m-extintor-dcp-4-5-kg", name: "Extintor DCP 4,5 kg", unit: "un", category: "Segurança & EPI",
    quotes: [
      { supplierId: "s-kangela-builders", price: 3800.0, date: "2026-04-14", city: "Maputo", note: "Real-informado – Kangela (2.5kg ×1.5)" },
    ],
  },
  {
    id: "m-cemflex-aditivo-para-argamassa-5-l", name: "Cemflex / aditivo para argamassa (5 L)", unit: "L", category: "Adesivos",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 850.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-adesivo-de-construcao-tubo", name: "Adesivo de construção (tubo)", unit: "tubo", category: "Adesivos",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 320.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-resina-epoxi-de-ancoragem-400-ml", name: "Resina epóxi de ancoragem 400 ml", unit: "un", category: "Adesivos",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 1450.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
  {
    id: "m-cola-branca-para-madeira-5-l", name: "Cola branca para madeira 5 L", unit: "L", category: "Adesivos",
    quotes: [
      { supplierId: "s-mercado-maputo-estimado", price: 980.0, date: "2026-04-14", city: "Maputo", note: "Estimado – mercado Maputo" },
    ],
  },
];
