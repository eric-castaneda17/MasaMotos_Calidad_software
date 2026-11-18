# Fase 7: Continuous Quality

Rama `feature/continuous-quality`, creada desde `2fb1537`. No existían workflows en el repositorio. Se añade únicamente `.github/workflows/continuous-quality.yml`.

## Exigencia de la guía

Fuente: ProyectoFinalCalidad2026.docx, Descargas. El punto 19 pide repositorio GitHub, commits claros y ramas; su evidencia es el enlace del repositorio y el listado de commits con descripción. El cronograma, punto 21, identifica «Continuous Quality» y «GitHub Actions evidencia de ejecución». El checklist, punto 26, exige «Existe CI/CD básico y Quality Gate». La guía no fija porcentajes de cobertura para esta canalización ni exige despliegue automático.

El punto 14 solicita una consulta aplicada de Lint y Sonar, máximo una página o una hoja del dossier. Aclara que no se exige ejecutar Sonar ni configurar un análisis estático completo. La consulta está en `../14_Consulta_Lint_Sonar.pdf`. No se instala ni configura Sonar.

## Canalización y criterios del Quality Gate

Se activa en push, pull request o ejecución manual. Un único job `Quality Gate` usa Ubuntu, Node.js 24 y el lockfile. Tiene permisos de lectura, 20 minutos de límite y cancela ejecuciones anteriores de la misma referencia. No despliega ni publica el producto.

| Comprobación | Aprobación | Rechazo |
| --- | --- | --- |
| Instalación | `npm ci --no-audit --no-fund` termina con 0 | Lockfile incompatible, descarga o instalación fallida |
| ESLint | `npm run lint -- --max-warnings=0` termina con 0 | Error, advertencia o fallo de configuración |
| Tipos | `next typegen` y `tsc --noEmit --incremental false` terminan con 0 | Fallo de generación o error de TypeScript |
| Vitest | Proyectos unit, rtl y observability: al menos 49 pruebas, todas aprobadas, ninguna pendiente | Prueba fallida, omitida, ausente respecto de la base o error de ejecución |
| Reversión simulada | `node --test --test-reporter=spec scripts/qa-reversion.test.mjs` termina con 0; base actual: 15 casos | Cualquier fallo del controlador simulado |
| Producción | `npm run build -- --webpack` termina con 0 | Error de compilación, tipos o prerender |
| Evidencia | Se conserva el artefacto de logs y resultados de la ejecución | Fallo al guardar el artefacto |

No se usa `continue-on-error`. Bash conserva el código de salida de los comandos aun cuando se capturan con `tee` mediante `pipefail`. El paso final rechaza el job si alguna comprobación anterior no aprobó. Una ejecución cancelada o incompleta no se considera aprobada. Este gate técnico no cierra los defectos abiertos ni autoriza por sí solo una liberación.

## Aislamiento y pruebas excluidas

CI no recibe secrets de Supabase ni datos de usuarios. Utiliza URL `https://ci.invalid` y una cadena ficticia de compilación. Verifica que no existan `.env`, `.env.local` ni `.qa`. Unitarias y RTL usan datos locales/mocks; observabilidad sustituye Supabase, autorización, navegación y caché; el controlador de reversión usa clientes simulados y solo lee fixtures SQL/JSON del repositorio.

No se ejecutan Postman/Newman, Playwright, preparación de fixtures, setup/reset, CA-15 real ni los escenarios Shift Right con escrituras. Requieren un ambiente de integración académico, autorización y credenciales privadas separadas. No se añaden al workflow. El build puede descargar la fuente Google existente; esa dependencia externa no supone acceso a Supabase.

## Estado de la evidencia

La validación local y sus salidas se conservan en `evidencias/`. Se realiza en una copia aislada del commit base y del workflow nuevo, sin archivos privados, para evitar sobrescribir las evidencias históricas que generan algunas pruebas.

**GitHub Actions remoto: PENDIENTE.** Las comprobaciones locales no sustituyen una ejecución remota. No se modifican estados SWR, CA-15 ni casos manuales por configurar CI. La matriz maestra conserva las fases anteriores; el gate es transversal y no acredita nuevos resultados funcionales.

Resultado local del 2026-11-18, Node.js 24.21.0 en Windows: instalación, ESLint sin advertencias, generación de tipos, TypeScript y compilación aprobaron. Vitest aprobó 49/49 (11 unitarias, 13 RTL y 25 de observabilidad), sin pendientes; el controlador simulado aprobó 15/15. Total: 64 pruebas aprobadas y ninguna fallida. YAML y estructura del workflow se verificaron localmente; aún no se validó su ejecución en el servicio de GitHub.

La instalación inicial falló por DNS del sandbox. La primera compilación también falló al descargar Outfit desde Google Fonts. Se repitió únicamente el comando afectado con autorización de red y ambas comprobaciones terminaron con 0. `resultados-locales.json` conserva esos incidentes y `build-sandbox.txt` la salida de compilación fallida. npm emitió advertencias sobre dependencias obsoletas y scripts de instalación; no se cambiaron versiones ni se atribuye una auditoría de seguridad. Las rutas de la copia temporal se normalizaron en las evidencias. Los pendientes históricos de seguridad, rendimiento, exploración y pruebas manuales se conservan.

## Cómo obtener la evidencia remota al publicar

1. Tras revisión y publicación autorizada de la rama, abrir GitHub → Actions → Continuous Quality. El push activa el workflow; también se ejecutará al abrir un PR. No usar `workflow_dispatch` hasta que el workflow esté disponible en la rama predeterminada.
2. Abrir la ejecución y comprobar rama, SHA, número de intento y estado de cada paso. Conservar el enlace del run, SHA y fecha en este dossier. Un run fallido o cancelado debe conservar ese resultado.
3. Descargar el artefacto `continuous-quality-<run_id>-<run_attempt>` dentro de `evidencias/github-actions/` y guardar una captura del resumen con los pasos y el Quality Gate. Los artefactos remotos caducan a los 14 días.
4. Solo entonces registrar el resultado remoto comprobado. La protección de ramas y exigir el check `Quality Gate` para fusionar se configura posteriormente por el responsable en GitHub; no se afirma que ya exista. No se efectúa despliegue automático.

Referencias técnicas: [GitHub Actions para Node.js](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs), [CLI de ESLint](https://eslint.org/docs/latest/use/command-line-interface), [Quality Gates de Sonar](https://docs.sonarsource.com/sonarqube-cloud/standards/managing-quality-gates/introduction-to-quality-gates). Consulta: 2026-11-18. Para tipos se revisó la documentación local de Next.js: `node_modules/next/dist/docs/01-app/03-api-reference/06-cli/next.md`, apartado `next typegen`.
