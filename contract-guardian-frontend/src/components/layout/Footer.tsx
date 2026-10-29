import { shortDate,TODAY } from '../../domain/contracts';
export function Footer(){return <footer className="main-footer"><span>© {TODAY.slice(0,4)} Contract Guardian. Mais clareza em cada contrato.</span><span className="demo-tag">Prévia de interface · dados locais · {shortDate(TODAY)}</span></footer>;}
