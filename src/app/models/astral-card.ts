export interface AstralCard {
  solarSign: string;
  lunarSign: string;
  ascendantSign: string;

  stelliumSign: string | null;

  hemispheres: {
    north: string;
    south: string;
    note: string;
  };

  keyElements: Array<'Fire' | 'Earth' | 'Air' | 'Water'>;

  composition: {
    Fire: number;
    Earth: number;
    Air: number;
    Water: number;
    note: string;
  };

  elementalEnergiesAndUsage: {
    Fire: string;
    Earth: string;
    Air: string;
    Water: string;
    practicalTips: string[];
  };

  regentHouse: {
    house: string; // e.g. "1st"
    regentPlanet: string; // e.g. "Mars"
    meaning: string;
  };

  lunarNodes: {
    northNode: { sign: string; house: string; themes: string[] };
    southNode: { sign: string; house: string; themes: string[] };
  };

  summary: string;
  disclaimers: string[];
}
