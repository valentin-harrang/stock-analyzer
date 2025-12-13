export interface StockListItem {
  symbol: string;
  name: string;
  sector: string;
  dividendYield?: string;
}

export const EU_DIVIDEND_STOCKS: StockListItem[] = [
  // France
  { symbol: 'TTE.PA', name: 'TotalEnergies', sector: 'Énergie', dividendYield: '5.2%' },
  { symbol: 'SAN.PA', name: 'Sanofi', sector: 'Santé', dividendYield: '4.1%' },
  { symbol: 'AI.PA', name: 'Air Liquide', sector: 'Chimie', dividendYield: '2.1%' },
  { symbol: 'BNP.PA', name: 'BNP Paribas', sector: 'Banque', dividendYield: '6.5%' },
  { symbol: 'ACA.PA', name: 'Crédit Agricole', sector: 'Banque', dividendYield: '7.8%' },
  { symbol: 'DG.PA', name: 'Vinci', sector: 'Construction', dividendYield: '3.8%' },
  { symbol: 'ENGI.PA', name: 'Engie', sector: 'Énergie', dividendYield: '8.2%' },
  // Pays-Bas
  { symbol: 'UNA.AS', name: 'Unilever', sector: 'Consommation', dividendYield: '3.4%' },
  { symbol: 'INGA.AS', name: 'ING Group', sector: 'Banque', dividendYield: '6.9%' },
  // Allemagne
  { symbol: 'ALV.DE', name: 'Allianz', sector: 'Assurance', dividendYield: '4.8%' },
  { symbol: 'MBG.DE', name: 'Mercedes-Benz', sector: 'Automobile', dividendYield: '7.1%' },
  { symbol: 'BMW.DE', name: 'BMW', sector: 'Automobile', dividendYield: '5.9%' },
  { symbol: 'BAS.DE', name: 'BASF', sector: 'Chimie', dividendYield: '5.5%' },
  { symbol: 'DTE.DE', name: 'Deutsche Telekom', sector: 'Télécom', dividendYield: '3.2%' },
  { symbol: 'MUV2.DE', name: 'Munich Re', sector: 'Assurance', dividendYield: '3.6%' },
  // Espagne
  { symbol: 'IBE.MC', name: 'Iberdrola', sector: 'Énergie', dividendYield: '4.3%' },
  { symbol: 'TEF.MC', name: 'Telefónica', sector: 'Télécom', dividendYield: '7.5%' },
  // Italie
  { symbol: 'ENEL.MI', name: 'Enel', sector: 'Énergie', dividendYield: '6.8%' },
  { symbol: 'ISP.MI', name: 'Intesa Sanpaolo', sector: 'Banque', dividendYield: '9.1%' },
];

export const CAC40_STOCKS: StockListItem[] = [
  { symbol: 'AI.PA', name: 'Air Liquide', sector: 'Chimie' },
  { symbol: 'AIR.PA', name: 'Airbus', sector: 'Aéronautique' },
  { symbol: 'ALO.PA', name: 'Alstom', sector: 'Industrie' },
  { symbol: 'MT.AS', name: 'ArcelorMittal', sector: 'Métallurgie' },
  { symbol: 'CS.PA', name: 'AXA', sector: 'Assurance' },
  { symbol: 'BNP.PA', name: 'BNP Paribas', sector: 'Banque' },
  { symbol: 'EN.PA', name: 'Bouygues', sector: 'Construction' },
  { symbol: 'CAP.PA', name: 'Capgemini', sector: 'Tech' },
  { symbol: 'CA.PA', name: 'Carrefour', sector: 'Distribution' },
  { symbol: 'ACA.PA', name: 'Crédit Agricole', sector: 'Banque' },
  { symbol: 'BN.PA', name: 'Danone', sector: 'Agroalimentaire' },
  { symbol: 'DSY.PA', name: 'Dassault Systèmes', sector: 'Tech' },
  { symbol: 'ENGI.PA', name: 'Engie', sector: 'Énergie' },
  { symbol: 'EL.PA', name: 'EssilorLuxottica', sector: 'Optique' },
  { symbol: 'ERF.PA', name: 'Eurofins Scientific', sector: 'Santé' },
  { symbol: 'RMS.PA', name: 'Hermès', sector: 'Luxe' },
  { symbol: 'KER.PA', name: 'Kering', sector: 'Luxe' },
  { symbol: 'LR.PA', name: 'Legrand', sector: 'Électrique' },
  { symbol: 'OR.PA', name: "L'Oréal", sector: 'Cosmétiques' },
  { symbol: 'MC.PA', name: 'LVMH', sector: 'Luxe' },
  { symbol: 'ML.PA', name: 'Michelin', sector: 'Automobile' },
  { symbol: 'ORA.PA', name: 'Orange', sector: 'Télécom' },
  { symbol: 'RI.PA', name: 'Pernod Ricard', sector: 'Boissons' },
  { symbol: 'PUB.PA', name: 'Publicis', sector: 'Publicité' },
  { symbol: 'SAF.PA', name: 'Safran', sector: 'Aéronautique' },
  { symbol: 'SGO.PA', name: 'Saint-Gobain', sector: 'Matériaux' },
  { symbol: 'SAN.PA', name: 'Sanofi', sector: 'Santé' },
  { symbol: 'SU.PA', name: 'Schneider Electric', sector: 'Électrique' },
  { symbol: 'GLE.PA', name: 'Société Générale', sector: 'Banque' },
  { symbol: 'STLAP.PA', name: 'Stellantis', sector: 'Automobile' },
  { symbol: 'STMPA.PA', name: 'STMicroelectronics', sector: 'Semi-conducteurs' },
  { symbol: 'TEP.PA', name: 'Teleperformance', sector: 'Services' },
  { symbol: 'HO.PA', name: 'Thales', sector: 'Défense' },
  { symbol: 'TTE.PA', name: 'TotalEnergies', sector: 'Énergie' },
  { symbol: 'URW.PA', name: 'Unibail-Rodamco', sector: 'Immobilier' },
  { symbol: 'VIE.PA', name: 'Veolia', sector: 'Environnement' },
  { symbol: 'DG.PA', name: 'Vinci', sector: 'Construction' },
  { symbol: 'VIV.PA', name: 'Vivendi', sector: 'Médias' },
];

export const PEA_STOCKS: StockListItem[] = [
  // Croissance
  { symbol: 'MC.PA', name: 'LVMH', sector: 'Luxe' },
  { symbol: 'RMS.PA', name: 'Hermès', sector: 'Luxe' },
  { symbol: 'OR.PA', name: "L'Oréal", sector: 'Cosmétiques' },
  { symbol: 'AIR.PA', name: 'Airbus', sector: 'Aéronautique' },
  { symbol: 'SAF.PA', name: 'Safran', sector: 'Aéronautique' },
  { symbol: 'DSY.PA', name: 'Dassault Systèmes', sector: 'Tech' },
  { symbol: 'CAP.PA', name: 'Capgemini', sector: 'Tech' },
  { symbol: 'SU.PA', name: 'Schneider Electric', sector: 'Électrique' },
  // Dividendes
  { symbol: 'TTE.PA', name: 'TotalEnergies', sector: 'Énergie' },
  { symbol: 'AI.PA', name: 'Air Liquide', sector: 'Chimie' },
  { symbol: 'SAN.PA', name: 'Sanofi', sector: 'Santé' },
  { symbol: 'BNP.PA', name: 'BNP Paribas', sector: 'Banque' },
  { symbol: 'ACA.PA', name: 'Crédit Agricole', sector: 'Banque' },
  { symbol: 'ENGI.PA', name: 'Engie', sector: 'Énergie' },
  // ETF PEA
  { symbol: 'CW8.PA', name: 'Amundi MSCI World', sector: 'ETF Monde' },
  { symbol: 'ESE.PA', name: 'BNP S&P 500', sector: 'ETF USA' },
  { symbol: 'PANX.PA', name: 'Amundi Nasdaq-100', sector: 'ETF Tech US' },
  { symbol: 'PAEEM.PA', name: 'Amundi Emerging Markets', sector: 'ETF Émergents' },
];
