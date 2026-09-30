/**
 * The token table: every TI-83/84 Plus token we know, keyed by its `.8xp` byte value.
 * Single-byte tokens have codes < 0x100; two-byte tokens are (prefix << 8) | second byte.
 *
 * Built by hand from public documentation (see THIRD_PARTY_NOTICES.md). Display text uses a few private
 * conventions that the font and `toPlain()` understand: ⁻ negation, ᴇ exponent marker, ⅈ imaginary unit,
 * ℯ Euler's constant, subscript digits for L₁ / Y₁, and spaces where the original token carries them.
 */
export interface TokenInfo {
  code: number;
  /** Display text (may contain special glyph characters). */
  text: string;
  /** Number of bytes in the .8xp encoding (1 or 2). */
  bytes: 1 | 2;
}

const RAW = `
01|►DMS
02|►Dec
03|►Frac
04|→
05|Boxplot
06|[
07|]
08|{
09|}
0A|ʳ
0B|°
0C|⁻¹
0D|²
0E|ᵀ
0F|³
10|(
11|)
12|round(
13|pxl-Test(
14|augment(
15|rowSwap(
16|row+(
17|*row(
18|*row+(
19|max(
1A|min(
1B|R►Pr(
1C|R►Pθ(
1D|P►Rx(
1E|P►Ry(
1F|median(
20|randM(
21|mean(
22|solve(
23|seq(
24|fnInt(
25|nDeriv(
27|fMin(
28|fMax(
29| 
2A|"
2B|,
2C|ⅈ
2D|!
2E|CubicReg 
2F|QuartReg 
3A|.
3B|ᴇ
3C| or 
3D| xor 
3E|:
3F|\\n
40| and 
5B|θ
5F|prgm
64|Radian
65|Degree
66|Normal
67|Sci
68|Eng
69|Float
6A|=
6B|<
6C|>
6D|≤
6E|≥
6F|≠
70|+
71|-
72|Ans
73|Fix 
74|Horiz
75|Full
76|Func
77|Param
78|Polar
79|Seq
7A|IndpntAuto
7B|IndpntAsk
7C|DependAuto
7D|DependAsk
7F|□
80|﹢
81|·
82|*
83|/
84|Trace
85|ClrDraw
86|ZStandard
87|ZTrig
88|ZBox
89|Zoom In
8A|Zoom Out
8B|ZSquare
8C|ZInteger
8D|ZPrevious
8E|ZDecimal
8F|ZoomStat
90|ZoomRcl
91|PrintScreen
92|ZoomSto
93|Text(
94| nPr 
95| nCr 
96|FnOn 
97|FnOff 
98|StorePic 
99|RecallPic 
9A|StoreGDB 
9B|RecallGDB 
9C|Line(
9D|Vertical 
9E|Pt-On(
9F|Pt-Off(
A0|Pt-Change(
A1|Pxl-On(
A2|Pxl-Off(
A3|Pxl-Change(
A4|Shade(
A5|Circle(
A6|Horizontal 
A7|Tangent(
A8|DrawInv 
A9|DrawF 
AB|rand
AC|π
AD|getKey
AE|'
AF|?
B0|⁻
B1|int(
B2|abs(
B3|det(
B4|identity(
B5|dim(
B6|sum(
B7|prod(
B8|not(
B9|iPart(
BA|fPart(
BC|√(
BD|³√(
BE|ln(
BF|ℯ^(
C0|log(
C1|10^(
C2|sin(
C3|sin⁻¹(
C4|cos(
C5|cos⁻¹(
C6|tan(
C7|tan⁻¹(
C8|sinh(
C9|sinh⁻¹(
CA|cosh(
CB|cosh⁻¹(
CC|tanh(
CD|tanh⁻¹(
CE|If 
CF|Then
D0|Else
D1|While 
D2|Repeat 
D3|For(
D4|End
D5|Return
D6|Lbl 
D7|Goto 
D8|Pause 
D9|Stop
DA|IS>(
DB|DS<(
DC|Input 
DD|Prompt 
DE|Disp 
DF|DispGraph
E0|Output(
E1|ClrHome
E2|Fill(
E3|SortA(
E4|SortD(
E5|DispTable
E6|Menu(
E7|Send(
E8|Get(
E9|PlotsOn 
EA|PlotsOff 
EB|∟
EC|Plot1(
ED|Plot2(
EE|Plot3(
F0|^
F1|ˣ√
F2|1-Var Stats 
F3|2-Var Stats 
F4|LinReg(a+bx) 
F5|ExpReg 
F6|LnReg 
F7|PwrReg 
F8|Med-Med 
F9|QuadReg 
FA|ClrList 
FB|ClrTable
FC|Histogram
FD|xyLine
FE|Scatter
FF|LinReg(ax+b) 
7E00|Sequential
7E01|Simul
7E02|PolarGC
7E03|RectGC
7E04|CoordOn
7E05|CoordOff
7E06|Connected
7E07|Dot
7E08|AxesOn
7E09|AxesOff
7E0A|GridOn
7E0B|GridOff
7E0C|LabelOn
7E0D|LabelOff
7E0E|Web
7E0F|Time
7E10|uvAxes
7E11|vwAxes
7E12|uwAxes
BB00|npv(
BB01|irr(
BB02|bal(
BB03|ΣPrn(
BB04|ΣInt(
BB05|►Nom(
BB06|►Eff(
BB07|dbd(
BB08|lcm(
BB09|gcd(
BB0A|randInt(
BB0B|randBin(
BB0C|sub(
BB0D|stdDev(
BB0E|variance(
BB0F|inString(
BB10|normalcdf(
BB11|invNorm(
BB12|tcdf(
BB13|χ²cdf(
BB14|Fcdf(
BB15|binompdf(
BB16|binomcdf(
BB17|poissonpdf(
BB18|poissoncdf(
BB19|geometpdf(
BB1A|geometcdf(
BB1B|normalpdf(
BB1C|tpdf(
BB1D|χ²pdf(
BB1E|Fpdf(
BB1F|randNorm(
BB20|tvm_Pmt
BB21|tvm_I%
BB22|tvm_PV
BB23|tvm_N
BB24|tvm_FV
BB25|conj(
BB26|real(
BB27|imag(
BB28|angle(
BB29|cumSum(
BB2A|expr(
BB2B|length(
BB2C|ΔList(
BB2D|ref(
BB2E|rref(
BB2F|►Rect
BB30|►Polar
BB31|ℯ
BB32|SinReg 
BB33|Logistic 
BB34|LinRegTTest 
BB35|ShadeNorm(
BB36|Shade_t(
BB37|Shadeχ²(
BB38|ShadeF(
BB39|Matr►list(
BB3A|List►matr(
BB3B|Z-Test(
BB3C|T-Test 
BB3D|2-SampZTest(
BB3E|1-PropZTest(
BB3F|2-PropZTest(
BB40|χ²-Test(
BB41|ZInterval 
BB42|2-SampZInt(
BB43|1-PropZInt(
BB44|2-PropZInt(
BB45|GraphStyle(
BB46|2-SampTTest 
BB47|2-SampFTest 
BB48|TInterval 
BB49|2-SampTInt 
BB4A|SetUpEditor 
BB4B|Pmt_End
BB4C|Pmt_Bgn
BB4D|Real
BB4E|re^θi
BB4F|a+bi
BB50|ExprOn
BB51|ExprOff
BB52|ClrAllLists
BB53|GetCalc(
BB54|DelVar 
BB55|Equ►String(
BB56|String►Equ(
BB57|Clear Entries
BB58|Select(
BB59|ANOVA(
BB5A|ModBoxplot
BB5B|NormProbPlot
BB64|G-T
BB65|ZoomFit
BB66|DiagnosticOn
BB67|DiagnosticOff
BB68|Archive 
BB69|UnArchive 
BB6A|Asm(
BB6B|AsmComp(
BB6C|AsmPrgm
EF00|setDate(
EF01|setTime(
EF02|checkTmr(
EF03|setDtFmt(
EF04|setTmFmt(
EF05|timeCnv(
EF06|dayOfWk(
EF07|getDtStr(
EF08|getTmStr(
EF09|getDate
EF0A|getTime
EF0B|startTmr
EF0C|getDtFmt
EF0D|getTmFmt
EF0E|isClockOn
EF0F|ClockOff
EF10|ClockOn
EF11|OpenLib(
EF12|ExecLib 
EF13|invT(
EF14|χ²GOF-Test(
EF15|LinRegTInt 
EF16|Manual-Fit 
EF17|ZQuadrant1
EF18|ZFrac1/2
EF19|ZFrac1/3
EF1A|ZFrac1/4
EF1B|ZFrac1/5
EF1C|ZFrac1/8
EF1D|ZFrac1/10
EF1E|⬚
EF2E|/
EF2F|␣
EF30|►n/d◄►Un/d
EF31|►F◄►D
EF32|remainder(
EF33|Σ(
EF34|logBASE(
EF35|randIntNoRep(
EF37|MATHPRINT
EF38|CLASSIC
EF39|n/d
EF3A|Un/d
EF3B|AUTO
EF3C|DEC
EF3D|FRAC
EF3F|STATWIZARD ON
EF40|STATWIZARD OFF
6201|RegEQ
6202|n
6203|x̄
6204|Σx
6205|Σx²
6206|Sx
6207|σx
6208|minX
6209|maxX
620A|minY
620B|maxY
620C|ȳ
620D|Σy
620E|Σy²
620F|Sy
6210|σy
6211|Σxy
6212|r
6213|Med
6214|Q₁
6215|Q₃
6216|a
6217|b
6218|c
6219|d
621A|e
621B|x₁
621C|x₂
621D|x₃
621E|y₁
621F|y₂
6220|y₃
6221|n
6222|p
6223|z
6224|t
6225|χ²
6226|F
6227|df
6228|p̂
6229|p̂₁
622A|p̂₂
622B|x̄₁
622C|Sx₁
622D|n₁
622E|x̄₂
622F|Sx₂
6230|n₂
6231|Sxp
6232|lower
6233|upper
6234|s
6235|r²
6236|R²
6237|df
6238|SS
6239|MS
623A|df
623B|SS
623C|MS
6300|ZXscl
6301|ZYscl
6302|Xscl
6303|Yscl
6304|u(nMin)
6305|v(nMin)
6306|Un-₁
6307|Vn-₁
6308|Zu(nMin)
6309|Zv(nMin)
630A|Xmin
630B|Xmax
630C|Ymin
630D|Ymax
630E|Tmin
630F|Tmax
6310|θmin
6311|θmax
6312|ZXmin
6313|ZXmax
6314|ZYmin
6315|ZYmax
6316|Zθmin
6317|Zθmax
6318|ZTmin
6319|ZTmax
631A|TblStart
631B|PlotStart
631C|ZPlotStart
631D|nMax
631E|ZnMax
631F|nMin
6320|ZnMin
6321|ΔTbl
6322|Tstep
6323|θstep
6324|ZTstep
6325|Zθstep
6326|ΔX
6327|ΔY
6328|XFact
6329|YFact
632A|TblInput
632B|N
632C|I%
632D|PV
632E|PMT
632F|FV
6330|P/Y
6331|C/Y
6332|w(nMin)
6333|Zw(nMin)
6334|PlotStep
6335|ZPlotStep
6336|Xres
6337|ZXres
BBCE|GarbageCollect
BBCD|Í
BBCF|~
BBD1|@
BBD2|#
BBD3|$
BBD4|&
BBD5|\u0060
BBD6|;
BBD7|\\
BBD8||
BBD9|_
BBDA|%
BBDB|…
BBDC|∠
BBDD|ß
BBDE|ˣ
BBDF|ᴛ
BBEA|₁₀
BBEB|◄
BBEC|►
BBED|↑
BBEE|↓
BBF0|×
BBF1|∫
BBF2|↑
BBF3|↓
BBF4|√
BBF5|⌸
`;

const SUB = '₀₁₂₃₄₅₆₇₈₉';
const entries = new Map<number, TokenInfo>();
const add = (code: number, text: string): void => {
  entries.set(code, { code, text, bytes: code > 0xff ? 2 : 1 });
};

for (const line of RAW.split('\n')) {
  if (!line) continue;
  const i = line.indexOf('|');
  const code = parseInt(line.slice(0, i), 16);
  let text = line.slice(i + 1);
  if (text === '\\n') text = '\n';
  add(code, text);
}

// digits and upper-case letters
for (let d = 0; d < 10; d++) add(0x30 + d, String(d));
for (let c = 0; c < 26; c++) add(0x41 + c, String.fromCharCode(65 + c));

// accented letters, Greek, lower-case letters, subscript digits (two-byte 0xBB group)
const ACCENTS = 'ÁÀÂÄáàâäÉÈÊËéèêë';
for (let i = 0; i < ACCENTS.length; i++) add(0xbb6e + i, ACCENTS[i]);
const ACCENTS2 = 'ÌÎÏíìîïÓÒÔÖóòôöÚÙÛÜúùûüÇçÑñ´\u0060¨¿¡αβγΔδελμπρΣ';
for (let i = 0; i < ACCENTS2.length; i++) add(0xbb7f + i, ACCENTS2[i]);
add(0xbbab, 'Φ');
add(0xbbac, 'Ω');
add(0xbbad, 'p\u0302');
add(0xbbae, 'χ');
add(0xbbaf, 'F');
for (let c = 0; c < 26; c++) add(0xbbb0 + c + (c >= 11 ? 1 : 0), String.fromCharCode(97 + c));
add(0xbbcb, 'σ');
add(0xbbcc, 'τ');
for (let d = 0; d < 10; d++) add(0xbbe0 + d, SUB[d]);

// matrices [A]..[J], lists L1..L6, equations, pictures, GDBs, strings
for (let i = 0; i < 10; i++) add(0x5c00 + i, `[${String.fromCharCode(65 + i)}]`);
for (let i = 0; i < 6; i++) add(0x5d00 + i, `L${SUB[i + 1]}`);
for (let i = 0; i < 9; i++) add(0x5e10 + i, `Y${SUB[i + 1]}`);
add(0x5e19, `Y${SUB[0]}`);
for (let i = 0; i < 6; i++) {
  add(0x5e20 + 2 * i, `X${SUB[i + 1]}T`);
  add(0x5e21 + 2 * i, `Y${SUB[i + 1]}T`);
  add(0x5e40 + i, `r${SUB[i + 1]}`);
}
add(0x5e80, 'u');
add(0x5e81, 'v');
add(0x5e82, 'w');
for (let i = 0; i < 10; i++) {
  const n = (i + 1) % 10;
  add(0x6000 + i, `Pic${n}`);
  add(0x6100 + i, `GDB${n}`);
  add(0xaa00 + i, `Str${n}`);
}

export const TOKENS: readonly TokenInfo[] = [...entries.values()].sort((a, b) => a.code - b.code);
export const TOKEN_BY_CODE: ReadonlyMap<number, TokenInfo> = entries;
export const tokenText = (code: number): string => entries.get(code)?.text ?? '?';
export const isTwoByteCode = (code: number): boolean => code > 0xff;
/** Prefix bytes that introduce a two-byte token. */
export const TWO_BYTE_PREFIXES: ReadonlySet<number> = new Set([
  0x5c, 0x5d, 0x5e, 0x60, 0x61, 0x62, 0x63, 0x7e, 0xaa, 0xbb, 0xef,
]);
