from pathlib import Path
import re


def add_imports(text: str, imports: str) -> str:
    if imports in text:
        return text
    lines = text.splitlines()
    insert_at = 0
    for i, line in enumerate(lines):
        if line.startswith('import'):
            insert_at = i + 1
    lines.insert(insert_at, imports)
    return '\n'.join(lines) + '\n'


def patch_file(path: Path) -> None:
    text = path.read_text(encoding='utf-8')
    text = add_imports(text, "import { applyBusinessRule, formatAnomalySummary } from '../../utils/validationRules';")
    text = add_imports(text, "import { summarizeError } from '../../utils/errorFormatting';")

    def add_business_rules(match: re.Match) -> str:
        content = match.group(0)
        if 'businessRulesApplied' in content:
            return content
        m = re.search(r"test:\s*'([^']+)'", content)
        test_name = m.group(1) if m else 'Unknown Test'
        insertion = f"                businessRulesApplied: [applyBusinessRule('{test_name}', anomalies || [])],\n"
        return content.replace('timestamp:', insertion + '                timestamp:')

    text = re.sub(
        r"testResultsCollector\.addResult\(\{[\s\S]*?timestamp: new Date\(\)\.toISOString\(\)\s*\}\);",
        add_business_rules,
        text,
    )

    text = re.sub(
        r'log:\s*`❌\s*\$\{String\(error\)(?:\.substring\(0,\s*\d+\))?\}`',
        'log: `❌ ${summarizeError(error)}`',
        text,
    )
    text = re.sub(
        r'log:\s*`\$\{String\(error\)(?:\.substring\(0,\s*\d+\))?\}`',
        'log: `${summarizeError(error)}`',
        text,
    )

    path.write_text(text, encoding='utf-8')


for file in ['tests/e2e/automation.test.ts', 'tests/e2e/transformation.test.ts']:
    patch_file(Path(file))
    print(f'patched {file}')
