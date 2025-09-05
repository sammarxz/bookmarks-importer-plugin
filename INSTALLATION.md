# 🚀 Instalação do Bookmarks Importer Plugin

## Método Rápido (Recomendado)

1. **Execute o script de instalação:**
   ```bash
   ./install-plugin.sh
   ```

2. **Copie os arquivos da pasta `dist/`:**
   - Navegue até a pasta `dist/` que foi criada
   - Copie todo o conteúdo (main.js, manifest.json, styles.css)

3. **Cole na pasta do Obsidian:**
   - Vá para: `[seu-vault]/.obsidian/plugins/bookmarks-importer/`
   - Se a pasta `bookmarks-importer` não existir, crie ela
   - Cole os 3 arquivos copiados

4. **Ative o plugin:**
   - Reinicie o Obsidian
   - Vá em Configurações → Community plugins
   - Procure "Bookmarks Importer" e ative

## Método Manual

```bash
# 1. Instalar dependências
npm install

# 2. Fazer build para produção
npm run build-plugin

# 3. Os arquivos estarão na pasta dist/
ls dist/
# Deve mostrar: main.js, manifest.json, styles.css
```

## Estrutura Final na Pasta do Obsidian

```
[seu-vault]/.obsidian/plugins/bookmarks-importer/
├── main.js          # Plugin compilado
├── manifest.json    # Metadados do plugin  
└── styles.css       # Estilos do plugin
```

## ✅ Como Testar se Funcionou

1. Abra o Obsidian
2. Procure pelo ícone de bookmark na barra lateral (ribbon)
3. Ou use Ctrl/Cmd+P → "Import Bookmarks HTML"
4. Selecione um arquivo HTML de bookmarks do seu navegador

## 🎯 Como Usar

1. **Exportar bookmarks do seu navegador:**
   - Chrome: Menu → Favoritos → Gerenciador de favoritos → ⋮ → Exportar favoritos
   - Firefox: Menu → Favoritos → Gerenciar favoritos → Importar e fazer backup → Exportar favoritos para HTML
   - Safari: File → Export Bookmarks

2. **Importar no Obsidian:**
   - Use o ícone de bookmark ou comando
   - Escolha o arquivo HTML exportado
   - O plugin criará um arquivo: `Bookmarks [YYYY-MM-DD].md`

3. **Configurar visualização:**
   - Configurações → Bookmarks Importer
   - Escolha: Lista (com pastas) ou Tabela (simplificada)

## 🔧 Solução de Problemas

- **Plugin não aparece:** Verifique se os 3 arquivos estão na pasta correta
- **Erro ao ativar:** Reinicie o Obsidian completamente
- **Screenshots não carregam:** Normal - algumas URLs podem não ter screenshot disponível (usará placeholder)

## 📱 Recursos

- Screenshots HD (1920x1080) quando disponíveis
- Placeholder automático para sites sem screenshot
- Layout responsivo para desktop e mobile
- Extração automática da data de criação dos bookmarks