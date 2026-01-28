#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question, defaultValue = "") {
  return new Promise((resolve) => {
    const prompt = defaultValue ? `${question} (${defaultValue}): ` : `${question}: `;
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

function sanitizeProjectName(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
}

async function setupProject() {
  console.log("🚀 Настройка TypeScript проекта\n");

  try {
    const defaultProjectName = sanitizeProjectName(path.basename(process.cwd()));

    const projectName = await askQuestion(
      "Введите название проекта",
      defaultProjectName === "." || defaultProjectName === "" ? "my-typescript-app" : defaultProjectName,
    );

    const projectDescription = await askQuestion("Введите описание проекта", "Modern TypeScript application");

    const author = await askQuestion("Введите имя автора", "");

    const version = await askQuestion("Введите версию проекта", "1.0.0");

    console.log("\n⚙️  Начинаю настройку...");

    const packagePath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

    packageJson.name = sanitizeProjectName(projectName);
    packageJson.version = version;
    packageJson.description = projectDescription;

    if (author) {
      packageJson.author = author;
    } else {
      delete packageJson.author;
    }

    if (packageJson.scripts && packageJson.scripts.setup) {
      delete packageJson.scripts.setup;
    }
    if (packageJson.scripts && packageJson.scripts.postinstall) {
      delete packageJson.scripts.postinstall;
    }
    if (packageJson.bin && packageJson.bin["ts-init"]) {
      delete packageJson.bin["ts-init"];
    }
    const setupScriptPath = path.join("./", "scripts");
    fs.unlinkSync(setupScriptPath);

    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log("✅ package.json обновлен");

    const readmeContent = `# ${projectName}

${projectDescription}

${author ? `**Автор:** ${author}\n` : ""}
**Версия:** ${version}

## Быстрый старт

\`\`\`bash
# Установка зависимостей
npm install

# Режим разработки
npm run dev

# Сборка для продакшена
npm run build


\`\`\`

## Структура проекта

\`\`\`
src/
├── controller/          # controller
├── service/             # service

\`\`\`

## Доступные команды

- \`npm run dev\` - Запуск в режиме разработки
- \`npm run build\` - Сборка проекта
`;

    fs.writeFileSync(path.join(process.cwd(), "README.md"), readmeContent);
    console.log("✅ README.md обновлен");

    // Обновляем другие файлы с шаблонными переменными
    updateTemplateFiles(projectName, projectDescription, author);

    // Создаем .env файл из .env.example если он существует
    createEnvFile();

    console.log("\n✅ Настройка проекта завершена!");
    console.log("\n📋 Следующие шаги:");
    console.log("1. Установите зависимости:");
    console.log("   npm install");
    console.log("\n2. Настройте переменные окружения:");
    console.log("   Отредактируйте файл .env");
    console.log("\n3. Запустите проект:");
    console.log("   npm run dev");
  } catch (error) {
    console.error("❌ Ошибка при настройке проекта:", error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Функция для обновления файлов с шаблонными переменными
function updateTemplateFiles(projectName, description, author) {
  const filesToUpdate = ["docker-compose.yml", ".env.example"];

  filesToUpdate.forEach((file) => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      try {
        let content = fs.readFileSync(filePath, "utf8");

        // Заменяем шаблонные переменные
        content = content.replace(/{{PROJECT_NAME}}/g, projectName);
        content = content.replace(/{{PROJECT_DESCRIPTION}}/g, description);
        content = content.replace(/{{AUTHOR}}/g, author || "");

        fs.writeFileSync(filePath, content);
        console.log(`✅ ${file} обновлен`);
      } catch (error) {
        console.log(`⚠️  Не удалось обновить ${file}: ${error.message}`);
      }
    }
  });
}

// Функция для создания .env файла
function createEnvFile() {
  const envExamplePath = path.join(process.cwd(), ".env.example");
  const envPath = path.join(process.cwd(), ".env");

  if (fs.existsSync(envExamplePath) && !fs.existsSync(envPath)) {
    try {
      fs.copyFileSync(envExamplePath, envPath);
      console.log("✅ .env файл создан из .env.example");
    } catch (error) {
      console.log("⚠️  Не удалось создать .env файл");
    }
  }
}

setupProject();
