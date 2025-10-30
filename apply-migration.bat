@echo off
echo ============================================
echo   APLICANDO MIGRAÇÃO - QUIZ_STEPS TABLE
echo ============================================
echo.

echo [1/3] Verificando Supabase CLI...
npx supabase --version
if %errorlevel% neq 0 (
    echo ERRO: Supabase CLI nao encontrado
    echo Instalando...
    npm install -g supabase
)

echo.
echo [2/3] Conectando ao projeto Supabase...
npx supabase link --project-ref rijvidluwvzvatoarqoe

echo.
echo [3/3] Aplicando migração FIX_QUIZ_STEPS_TABLE.sql...
npx supabase db push --db-url postgresql://postgres:[YOUR-PASSWORD]@db.rijvidluwvzvatoarqoe.supabase.co:5432/postgres --include-all

echo.
echo ============================================
echo   CONCLUIDO!
echo ============================================
echo.
echo A tabela quiz_steps foi criada/atualizada.
echo Agora você pode testar o salvamento no app!
echo.
pause
