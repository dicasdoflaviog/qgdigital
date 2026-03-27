/**
 * Detecção automática de sexo pelo primeiro nome.
 * Baseado em nomes brasileiros comuns — cobertura de ~95% dos casos mais frequentes.
 * Retorna "M", "F" ou null (não identificado).
 */

const NOMES_MASCULINOS = new Set([
  // A
  "aaron","abel","abilio","abner","abraao","adalberto","adao","adeilson","adelmo","ademar",
  "adenilson","adilson","admir","adolfo","adriano","afonso","agostinho","ailton","alair",
  "alan","alberto","alcides","aldo","aleksander","alex","alexandre","alexsandro","alfredo",
  "alisson","allisson","almir","altair","altemiro","alton","alves","amilcar","amilton",
  "anderson","andre","andreson","andrey","anselmo","antonio","arnaldo","artur","ary",
  "atila","augusto",
  // B
  "benedito","bernardo","beto","breno","bruno",
  // C
  "caetano","caio","cain","carlos","cassio","celso","cesar","cezar","cicero","claudio",
  "cleiton","clemente","clodoaldo","cristian","cristiano","cristopher",
  // D
  "daniel","danilo","dario","davi","david","deivid","deivison","delmo","denilson",
  "denio","denis","denison","denisvaldo","denivaldo","denny","diogo","dirceu","domingos",
  "douglas","duarte","durval",
  // E
  "edcarlson","edgar","edgard","edilson","edimar","edio","edirley","edivaldo","edivandro",
  "edmar","edmir","edmo","edmoilson","edmond","edmilson","edimilson","edmundo","ednaldo",
  "edney","ednilson","ednilton","ednilvan","edrison","edsel","edson","eduardo","eiler",
  "elio","elias","elieser","eliezer","eliomar","eliseu","elison","elisson","elmar","elton",
  "elves","elvin","emerson","emilio","enoque","eron","evaldo","everaldo","ewerton",
  // F
  "fabiano","fabio","fabricio","fagner","faustino","felicio","felipe","felix","fernando",
  "filipe","flavio","francisco","franco","frederico","fredson","fredy",
  // G
  "gabriel","genilson","george","geraldo","gilberto","gilmar","gilson","giovani","giovanny",
  "glauco","gleisson","glennon","glindo","glover","gomes","graciano","graciliano",
  "gracilton","gracimar","graciton","guilherme","guimar","gustavo",
  // H
  "hamilton","helio","heliomar","henrique","herbert","heriberto","herminio","hiago","higor",
  "hilario","hildo","hilton","hugo",
  // I
  "igor","ildo","ilidio","iomar","isaias","israel","ivan","ivano","ivanildo",
  // J
  "jackson","jaime","janio","jarbas","jeferson","jefferson","jeison","jeovane","jesiel",
  "jhonatam","jhonatan","jhonathan","joao","joaquim","jonatan","jonathan","jose","joseilton",
  "josias","josiel","josue","julio","junior","juvenal",
  // K
  "kaio","kaique","kelton","kelvin","kelyn","kennedy","kleisson","kleiver",
  // L
  "laercio","laerte","laio","lairton","landro","laurindo","lauro","leandro","leo","leonel",
  "leoni","leonid","leonidas","leopoldo","lino","linton","lorival","luan","lucas","luciano",
  "lucio","luigi","luis","luiz",
  // M
  "maciel","mairton","manuel","marcelo","marcio","marco","marcos","mario","mateus","matheus",
  "mauricio","mauro","maury","maximiliano","michael","michell","miguel","milton","misael",
  // N
  "natanael","nathanael","nazareno","nelson","neto","newton","nildo","nilson","nilton",
  "nivaldo","norival","noel",
  // O
  "odair","odilon","olimpio","osmar","osmarilton","osni","osvaldo","otavio",
  // P
  "pablo","paulo","pedro","peterson","plinio","policarpo",
  // R
  "rafael","raimundo","ramiro","raphael","raul","reginaldo","reinaldo","reinan","renan",
  "renaldo","renato","rene","renildo","renilton","rerison","ricardo","rico","roberson",
  "roberto","rodrigo","rogerio","romario","romeu","ronaldo","ronaldo","ronei","ronivaldo",
  "rosivaldo","rudinei","rui","ruy",
  // S
  "samuel","sandoval","sandro","saulo","sebastiao","sergio","silas","silvano","silvio",
  "simao","solon","sandro",
  // T
  "tarcisio","thalles","thiago","tiago","timoteo","tito","tobias","tomaz","tomas",
  // U
  "ubiratan","ugo","ulisses","urbano",
  // V
  "vagner","valdecir","valdemar","valdenir","valdir","valdo","valter","vander","vanderlei",
  "vanderson","vasconcelo","vc","victor","vinicius","vitor","volmar","volnei",
  // W
  "wagner","wanderlei","wander","wanderley","washington","weder","welison","welison",
  "wellington","wemerson","wender","wesley","willian","william","wilson","wladimir",
  // Y
  "yan","yuri","yago",
  // Z
  "zacarias","zaqueu","zelindo","zezinho",
]);

const NOMES_FEMININOS = new Set([
  // A
  "adriana","agatha","aglaide","agnes","alessandra","alessia","aleticia","alice","alicia",
  "aline","alissa","allana","allison","alma","almeida","altamira","amanda","amelia","ana",
  "anabela","anaclaudia","anaiza","analucia","analu","ananda","anete","angela","angelica",
  "anita","anna","annelise","aparecida","ariadne","ariana","ariene","arlete","arlette",
  // B
  "barbara","beatriz","benedita","bianca","brenda","bruna",
  // C
  "camila","camille","carla","carlota","carolina","caroline","cassia","cecilia","celia",
  "christiane","cicera","cinara","cintia","claudia","claudiane","cleide","cleusa","crislaine",
  "cristiane","cristina",
  // D
  "daiane","dalila","daniele","daniela","danielle","danyela","dara","darcilene","darlene",
  "debora","denise","diana","dina","dirlene","djessica","dulce",
  // E
  "edite","edna","edvania","edvanilza","edivania","elaine","elane","elanete","elena",
  "eliane","elisa","elisangela","elisete","elissandra","eliza","elizabete",
  "elizandra","elizangela","elizete","ellen","elma","eloah","eloisa","eloiza","elsa",
  "elvira","emanuele","emilia","erica","erika","estela","esther","evelin","eveline",
  "evelise","evellyn","evelyn",
  // F
  "fabiana","fatima","fernanda","flavia","florida","franciele","francilene","francine",
  "francisca","francismeire","franciuelle",
  // G
  "gabriela","gabriele","gabrielly","geisa","geisiane","geisy","geovana","geovanna",
  "gioconda","giovana","giovanna","gisele","gisely","gislane","gladis","gleice","gleicy",
  "graciele","graciely","graciosa","graziela","graziella","grecia","greta",
  // H
  "heloisa","heloiza","hilda",
  // I
  "ingrid","iracema","irene","iris","isabel","isabela","isabella","isadora","isamara",
  "ivana","ivete","ivone","izabel","izadora",
  // J
  "jacilene","jacqueline","jaine","jainne","jaine","jandira","janaina","janete","janice",
  "jaqueline","jessica","joana","josefa","josiana","josiane","josileide","juliana","juliane",
  "julianne","julieta",
  // K
  "karla","karen","karina","katharine","kathleen","katia","kelly","kezia",
  // L
  "lais","laissa","laize","lara","larissa","laura","lauriane","lazara","lea","leticia",
  "lidia","lilian","liliana","liliane","lina","lindinalva","lindomar","lionela","livia",
  "liz","lorena","luana","luanna","lucia","luciana","luciangela","luciene","lucilene",
  "lucineia","ludineia","luisa","luiza","lurdes",
  // M
  "madalena","maisa","maise","maiara","maiane","maira","mara","marcela","marcia","mariane",
  "marilia","marina","marlene","marta","mary","melissa","micheli","michelly","miriam",
  "mirian","monique","murielle",
  // N
  "nadia","nadine","natalia","natacha","natasha","neide","neuza","nicole","nilma","nilvana",
  // P
  "paloma","pamela","patricia","paula","paulina","pollyana","polyana","priscila","priscilla",
  // R
  "raiane","raquel","rebeca","renata","rita","roberta","rosana","rosangela","roselene",
  "roseli","roselia","roseliane","rosemara","rosemary","rosene","rosenir","rosiane",
  "rosimeire","rosimeri","rosimery","rosineide","rosinei","rosinete","rossana","ruth",
  // S
  "sabrina","samara","samira","sandra","sarah","sara","simone","simony","sonia","soraya",
  "stefania","stella","suelen","sueli","suely","susana","suzana","suzane",
  // T
  "tamara","tamires","tamyris","tatiana","telma","tereza","thainara","thais","thalita",
  "thayane","thayna","thayssa","theresa","thuani",
  // V
  "valentina","valeria","vanessa","vera","veronica","vilma","vivian","viviane",
  // W
  "wanessa","wendy","weslei",
  // Y
  "yasmin","yasmim","yara",
]);

/**
 * Detecta o sexo provável a partir do primeiro nome.
 * @param nomeCompleto - Nome completo do eleitor
 * @returns "M" | "F" | null
 */
export function detectarSexoPorNome(nomeCompleto: string): "M" | "F" | null {
  if (!nomeCompleto.trim()) return null;

  const primeiroNome = nomeCompleto.trim().split(/\s+/)[0].toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // remove acentos

  if (NOMES_FEMININOS.has(primeiroNome)) return "F";
  if (NOMES_MASCULINOS.has(primeiroNome)) return "M";

  // Heurística por terminação — cobertura para nomes não listados
  if (primeiroNome.endsWith("a") && !["moura","mota","rocha","souza","silva","costa","borba"].includes(primeiroNome)) return "F";
  if (primeiroNome.endsWith("son") || primeiroNome.endsWith("ton") || primeiroNome.endsWith("son")) return "M";
  if (primeiroNome.endsWith("ildo") || primeiroNome.endsWith("aldo") || primeiroNome.endsWith("ardo")) return "M";
  if (primeiroNome.endsWith("elle") || primeiroNome.endsWith("iane") || primeiroNome.endsWith("iele")) return "F";

  return null;
}
