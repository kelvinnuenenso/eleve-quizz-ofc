#!/bin/bash

echo "============================================"
echo "  APLICANDO MIGRAÇÃO - QUIZ_STEPS TABLE"
echo "============================================"
echo ""

echo "[1/3] Verificando Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo "ERRO: Supabase CLI não encontrado"
    echo "Instalando..."
    npm install -g supabase
fi

echo ""
echo "[2/3] Conectando ao projeto Supabase..."
npx supabase link --project-ref rijvidluwvzvatoarqoe

echo ""
echo "[3/3] Aplicando migração FIX_QUIZ_STEPS_TABLE.sql..."
npx supabase db execute --file supabase/FIX_QUIZ_STEPS_TABLE.sql --project-ref rijvidluwvzvatoarqoe

echo ""
echo "============================================"
echo "  CONCLUÍDO!"
echo "============================================"
echo ""
echo "A tabela quiz_steps foi criada/atualizada."
echo "Agora você pode testar o salvamento no app!"
echo ""
