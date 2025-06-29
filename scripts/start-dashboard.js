
import { exec } from 'child_process';
import chalk from 'chalk';

console.log(chalk.blue.bold('🚀 Starting the Sheets Analytics Dashboard'));
console.log(chalk.gray('----------------------------------------------'));




function logWithTime(message) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${message}`);
}


// Start the server
logWithTime(chalk.yellow('📊 Starting the API server...'));
const serverProcess = exec('npm run server');

serverProcess.stdout.on('data', (data) => {

  console.log(chalk.green(`[SERVER] ${data.trim()}`));
});

serverProcess.stderr.on('data', (data) => {

  console.log(chalk.red(`[SERVER ERROR] ${data.trim()}`));
});



setTimeout(() => {

  logWithTime(chalk.yellow('🖥️ Starting the frontend development server...'));
  const frontendProcess = exec('npm run dev');

  frontendProcess.stdout.on('data', (data) => {
    console.log(chalk.blue(`[FRONTEND] ${data.trim()}`));
    


    if (data.includes('Local:')) {
      const localUrl = data.match(/Local:\s+(http:\/\/localhost:[0-9]+)/);
      if (localUrl && localUrl[1]) {
        logWithTime(chalk.green.bold(`✅ Dashboard is running!`));
        logWithTime(chalk.cyan(`📈 View the dashboard at: ${localUrl[1]}/sheets-dashboard`));
      }
    }
  });

  frontendProcess.stderr.on('data', (data) => {
    console.log(chalk.red(`[FRONTEND ERROR] ${data.trim()}`));
  });

  
  frontendProcess.on('exit', (code) => {
    logWithTime(chalk.red(`🛑 Frontend process exited with code ${code}`));
    serverProcess.kill();
    process.exit(code);
  });
}, 2000);



serverProcess.on('exit', (code) => {
  logWithTime(chalk.red(`🛑 Server process exited with code ${code}`));
  process.exit(code);
});


process.on('SIGINT', () => {
  logWithTime(chalk.yellow('👋 Shutting down all processes...'));
  serverProcess.kill();
  process.exit(0);
}); 