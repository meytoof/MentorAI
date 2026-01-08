// Fonction générique pour décomposer n'importe quel calcul de manière pédagogique
// Méthode classique de pose d'opération (de haut en bas)

export interface CalculationStep {
  type: "text" | "line" | "circle" | "rectangle" | "arrow";
  color: string;
  text?: string;
  position?: { x: number; y: number };
  points?: { x: number; y: number }[];
  from?: { x: number; y: number };
  to?: { x: number; y: number };
  center?: { x: number; y: number };
  radius?: number;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  fontSize?: number;
  width?: number;
  fill?: boolean;
}

// Décompose un nombre en chiffres (unités, dizaines, centaines, etc.)
function getDigits(num: number): number[] {
  return num.toString().split('').map(Number).reverse(); // reverse pour avoir [unités, dizaines, centaines...]
}

// Génère la décomposition complète d'une soustraction
function decomposeSubtraction(num1: number, num2: number): CalculationStep[] {
  const steps: CalculationStep[] = [];
  const num1Str = num1.toString();
  const num2Str = num2.toString();
  const maxLength = Math.max(num1Str.length, num2Str.length);
  
  // Aligner les nombres (ajouter des zéros devant si nécessaire)
  const aligned1 = num1Str.padStart(maxLength, '0');
  const aligned2 = num2Str.padStart(maxLength, '0');
  
  let yPos = 50;
  const startX = 100;
  const digitWidth = 50;
  
  // D'abord, identifier toutes les colonnes qui ont besoin de prendre une dizaine
  const digits1 = getDigits(num1);
  const digits2 = getDigits(num2);
  const borrows: boolean[] = []; // borrows[i] = true si la colonne i (de droite, 0=unités) a besoin de prendre une dizaine
  let borrow = 0;
  
  for (let i = 0; i < maxLength; i++) {
    const d1 = digits1[i] || 0;
    const d2 = digits2[i] || 0;
    if (d1 - borrow < d2) {
      borrows[i] = true;
      borrow = 1;
    } else {
      borrows[i] = false;
      borrow = 0;
    }
  }
  
  // ÉTAPE 1 : Poser le calcul (ligne par ligne, de haut en bas)
  // Ligne 1 : Premier nombre (avec les chiffres modifiés si une dizaine a été prise)
  aligned1.split('').forEach((digit, index) => {
    // index va de gauche à droite (0 = chiffre le plus à gauche = dizaines pour "85")
    // Pour savoir si cette colonne doit donner une dizaine, on regarde si la colonne de droite a besoin de prendre
    // borrows[i] correspond à la colonne i de droite (0 = unités, 1 = dizaines)
    // Pour la colonne index (de gauche), rightColumnIndex = maxLength - 1 - index
    // Si borrows[rightColumnIndex - 1] est true, la colonne de droite (unités) a besoin de prendre
    // et cette colonne (dizaines) doit donner 1
    
    const isUnits = index === aligned1.length - 1;
    const isTens = index === aligned1.length - 2;
    let color = isUnits ? "#60a5fa" : isTens ? "#3b82f6" : "#2563eb";
    
    const columnX = startX + (index * digitWidth);
    const rightColumnIndex = maxLength - 1 - index; // Index dans borrows (0 = unités, 1 = dizaines, etc.)
    
    // Si la colonne de droite (unités) a besoin de prendre une dizaine, cette colonne (dizaines) doit donner 1
    // Pour "85 - 17" : index 0 = "8" (dizaines), rightColumnIndex = 1
    // borrows[0] = true (les unités ont besoin de prendre)
    // Donc on vérifie borrows[rightColumnIndex - 1] = borrows[0] = true
    if (rightColumnIndex > 0 && borrows[rightColumnIndex - 1]) {
      const originalDigit = parseInt(digit);
      const newDigit = originalDigit - 1;
      
      // Dessiner le -1 au-dessus de cette colonne (exactement au-dessus du chiffre)
      steps.push({
        type: "text",
        color: "#ef4444",
        text: "-1",
        position: { x: columnX - 10, y: 25 },
        fontSize: 22,
      });
      
      // Barrer l'ancien chiffre
      steps.push({
        type: "line",
        color: "#ef4444",
        points: [
          { x: columnX - 18, y: yPos + 5 },
          { x: columnX + 8, y: yPos + 5 }
        ],
        width: 2,
      });
      
      // Afficher le nouveau chiffre (en vert pour montrer la modification)
      color = "#10b981";
      steps.push({
        type: "text",
        color: color,
        text: newDigit.toString(),
        position: { x: columnX - 10, y: yPos },
        fontSize: 36,
      });
    } else {
      // Afficher normalement
      steps.push({
        type: "text",
        color: color,
        text: digit,
        position: { x: columnX - 10, y: yPos },
        fontSize: 36,
      });
    }
  });
  
  // Ligne 2 : Opérateur et deuxième nombre
  yPos += 50;
  steps.push({
    type: "text",
    color: "#ffffff",
    text: "-",
    position: { x: startX - 30, y: yPos },
    fontSize: 36,
  });
  
  aligned2.split('').forEach((digit, index) => {
    const isUnits = index === aligned2.length - 1;
    const isTens = index === aligned2.length - 2;
    const color = isUnits ? "#f87171" : isTens ? "#ef4444" : "#dc2626"; // Unités clair, dizaines foncé
    steps.push({
      type: "text",
      color: color,
      text: digit,
      position: { x: startX + (index * digitWidth), y: yPos },
      fontSize: 36,
    });
  });
  
  // Ligne 3 : Trait de séparation
  yPos += 20;
  const lineEndX = startX + (maxLength * digitWidth);
  steps.push({
    type: "line",
    color: "#ffffff",
    points: [
      { x: startX - 40, y: yPos },
      { x: lineEndX, y: yPos }
    ],
    width: 3,
  });
  
  yPos += 60;
  
  // ÉTAPE 2 : Calculer chaque colonne de droite à gauche
  // Réutiliser les variables borrows et digits déjà calculées
  borrow = 0;
  const resultDigits: (number | null)[] = [];
  let yPosCalc = yPos;
  for (let i = 0; i < maxLength; i++) {
    const d1 = digits1[i] || 0;
    const d2 = digits2[i] || 0;
    const position = maxLength - 1 - i; // Position dans l'affichage (de gauche à droite)
    
    // Annotation de la colonne
    const columnX = startX + (position * digitWidth);
    const columnName = i === 0 ? "unités" : i === 1 ? "dizaines" : i === 2 ? "centaines" : `${i + 1}ème position`;
    
    steps.push({
      type: "text",
      color: "#a855f7",
      text: `Colonne ${columnName}:`,
      position: { x: 400, y: yPosCalc },
      fontSize: 16,
    });
    
    // Montrer les chiffres de cette colonne (avec le chiffre modifié si une dizaine a été prise)
    const displayD1 = borrows[i] ? (10 + d1 - borrow) : (d1 - borrow);
    const displayD1Color = borrows[i] ? "#10b981" : (i === 0 ? "#60a5fa" : "#3b82f6");
    
    steps.push({
      type: "text",
      color: displayD1Color,
      text: `${displayD1}`,
      position: { x: 400, y: yPosCalc + 25 },
      fontSize: 20,
    });
    
    steps.push({
      type: "text",
      color: "#ffffff",
      text: "-",
      position: { x: 430, y: yPosCalc + 25 },
      fontSize: 20,
    });
    
    steps.push({
      type: "text",
      color: i === 0 ? "#f87171" : "#ef4444",
      text: `${d2}`,
      position: { x: 450, y: yPosCalc + 25 },
      fontSize: 20,
    });
    
    // Si besoin de prendre une dizaine
    if (borrows[i]) {
      steps.push({
        type: "text",
        color: "#f59e0b",
        text: `${d1 - borrow} < ${d2} ? Il faut prendre une dizaine !`,
        position: { x: 400, y: yPosCalc + 50 },
        fontSize: 18,
      });
      
      // Flèche vers la colonne de gauche
      if (i < maxLength - 1) {
        steps.push({
          type: "arrow",
          color: "#a855f7",
          from: { x: columnX, y: yPosCalc + 30 },
          to: { x: startX + ((position + 1) * digitWidth), y: 50 },
          width: 3,
        });
      }
      
      // Transformer : prendre une dizaine de la colonne de gauche
      const borrowedValue = 10 + d1 - borrow;
      steps.push({
        type: "text",
        color: "#10b981",
        text: `On prend 1 dizaine: ${d1 - borrow} devient ${borrowedValue}`,
        position: { x: 400, y: yPosCalc + 75 },
        fontSize: 18,
      });
      
      const result = borrowedValue - d2;
      resultDigits[i] = result;
      
      steps.push({
        type: "text",
        color: "#f59e0b",
        text: `${borrowedValue} - ${d2} = ?`,
        position: { x: 400, y: yPosCalc + 100 },
        fontSize: 20,
      });
      
      steps.push({
        type: "text",
        color: "#a855f7",
        text: "Calcule !",
        position: { x: 400, y: yPosCalc + 125 },
        fontSize: 16,
      });
      
      borrow = 1;
    } else {
      const result = d1 - borrow - d2;
      resultDigits[i] = result;
      
      steps.push({
        type: "text",
        color: "#f59e0b",
        text: `${d1 - borrow} - ${d2} = ?`,
        position: { x: 400, y: yPosCalc + 50 },
        fontSize: 20,
      });
      
      steps.push({
        type: "text",
        color: "#a855f7",
        text: "Calcule !",
        position: { x: 400, y: yPosCalc + 75 },
        fontSize: 16,
      });
      
      borrow = 0;
    }
    
    yPosCalc += 150;
  }
  
  yPos = yPosCalc;
  
  // ÉTAPE 3 : Afficher la structure du résultat (cases vides)
  yPos += 20;
  steps.push({
    type: "text",
    color: "#ffffff",
    text: "Résultat :",
    position: { x: startX - 40, y: yPos },
    fontSize: 20,
  });
  
  for (let i = 0; i < maxLength; i++) {
    const position = maxLength - 1 - i;
    const boxX = startX + (position * digitWidth);
    
    steps.push({
      type: "rectangle",
      color: "#f59e0b",
      start: { x: boxX - 20, y: yPos + 10 },
      end: { x: boxX + 20, y: yPos + 60 },
      width: 3,
      fill: false,
    });
    
    steps.push({
      type: "text",
      color: "#f59e0b",
      text: "?",
      position: { x: boxX - 5, y: yPos + 45 },
      fontSize: 24,
    });
  }
  
  steps.push({
    type: "text",
    color: "#a855f7",
    text: "Remplis les cases avec ton résultat !",
    position: { x: startX, y: yPos + 80 },
    fontSize: 18,
  });
  
  return steps;
}

// Génère la décomposition complète d'une addition
function decomposeAddition(num1: number, num2: number): CalculationStep[] {
  const steps: CalculationStep[] = [];
  const num1Str = num1.toString();
  const num2Str = num2.toString();
  const maxLength = Math.max(num1Str.length, num2Str.length);
  
  const aligned1 = num1Str.padStart(maxLength, '0');
  const aligned2 = num2Str.padStart(maxLength, '0');
  
  let yPos = 50;
  const startX = 100;
  const digitWidth = 50;
  
  // Poser le calcul
  aligned1.split('').forEach((digit, index) => {
    const isUnits = index === aligned1.length - 1;
    const color = isUnits ? "#60a5fa" : "#3b82f6";
    steps.push({
      type: "text",
      color: color,
      text: digit,
      position: { x: startX + (index * digitWidth), y: yPos },
      fontSize: 36,
    });
  });
  
  yPos += 50;
  steps.push({
    type: "text",
    color: "#ffffff",
    text: "+",
    position: { x: startX - 30, y: yPos },
    fontSize: 36,
  });
  
  aligned2.split('').forEach((digit, index) => {
    const isUnits = index === aligned2.length - 1;
    const color = isUnits ? "#f87171" : "#ef4444";
    steps.push({
      type: "text",
      color: color,
      text: digit,
      position: { x: startX + (index * digitWidth), y: yPos },
      fontSize: 36,
    });
  });
  
  yPos += 20;
  steps.push({
    type: "line",
    color: "#ffffff",
    points: [
      { x: startX - 40, y: yPos },
      { x: startX + (maxLength * digitWidth), y: yPos }
    ],
    width: 3,
  });
  
  yPos += 60;
  
  // Calculer de droite à gauche avec retenues
  const digits1 = getDigits(num1);
  const digits2 = getDigits(num2);
  let carry = 0;
  
  for (let i = 0; i < maxLength; i++) {
    const d1 = digits1[i] || 0;
    const d2 = digits2[i] || 0;
    const position = maxLength - 1 - i;
    const columnX = startX + (position * digitWidth);
    const columnName = i === 0 ? "unités" : i === 1 ? "dizaines" : "centaines";
    
    steps.push({
      type: "text",
      color: "#a855f7",
      text: `Colonne ${columnName}:`,
      position: { x: 400, y: yPos },
      fontSize: 16,
    });
    
    steps.push({
      type: "text",
      color: "#60a5fa",
      text: `${d1}`,
      position: { x: 400, y: yPos + 25 },
      fontSize: 20,
    });
    
    steps.push({
      type: "text",
      color: "#ffffff",
      text: "+",
      position: { x: 430, y: yPos + 25 },
      fontSize: 20,
    });
    
    steps.push({
      type: "text",
      color: "#f87171",
      text: `${d2}`,
      position: { x: 450, y: yPos + 25 },
      fontSize: 20,
    });
    
    if (carry > 0) {
      steps.push({
        type: "text",
        color: "#10b981",
        text: `+ ${carry} (retenue)`,
        position: { x: 480, y: yPos + 25 },
        fontSize: 20,
      });
    }
    
    const sum = d1 + d2 + carry;
    const resultDigit = sum % 10;
    carry = Math.floor(sum / 10);
    
    steps.push({
      type: "text",
      color: "#f59e0b",
      text: `= ${sum} → écrit ${resultDigit}, retenue ${carry}`,
      position: { x: 400, y: yPos + 50 },
      fontSize: 18,
    });
    
    if (carry > 0 && i < maxLength - 1) {
      steps.push({
        type: "arrow",
        color: "#10b981",
        from: { x: columnX, y: yPos + 30 },
        to: { x: startX + ((position - 1) * digitWidth), y: yPos - 20 },
        width: 3,
      });
      
      steps.push({
        type: "text",
        color: "#10b981",
        text: `+${carry}`,
        position: { x: startX + ((position - 1) * digitWidth) - 15, y: yPos - 40 },
        fontSize: 18,
      });
    }
    
    yPos += 120;
  }
  
  // Structure résultat
  yPos += 20;
  steps.push({
    type: "text",
    color: "#ffffff",
    text: "Résultat :",
    position: { x: startX - 40, y: yPos },
    fontSize: 20,
  });
  
  for (let i = 0; i <= maxLength; i++) {
    const position = maxLength - i;
    const boxX = startX + (position * digitWidth);
    
    steps.push({
      type: "rectangle",
      color: "#f59e0b",
      start: { x: boxX - 20, y: yPos + 10 },
      end: { x: boxX + 20, y: yPos + 60 },
      width: 3,
      fill: false,
    });
    
    steps.push({
      type: "text",
      color: "#f59e0b",
      text: "?",
      position: { x: boxX - 5, y: yPos + 45 },
      fontSize: 24,
    });
  }
  
  return steps;
}

// Fonction principale qui décompose n'importe quel calcul
export function decomposeCalculation(question: string): CalculationStep[] {
  const match = question.match(/(\d+)\s*([+\-*/])\s*(\d+)/);
  if (!match) return [];
  
  const [, num1Str, operator, num2Str] = match;
  const num1 = parseInt(num1Str);
  const num2 = parseInt(num2Str);
  
  switch (operator) {
    case "-":
      return decomposeSubtraction(num1, num2);
    case "+":
      return decomposeAddition(num1, num2);
    case "*":
    case "×":
      // TODO: Implémenter multiplication
      return [];
    case "/":
    case "÷":
      // TODO: Implémenter division
      return [];
    default:
      return [];
  }
}

