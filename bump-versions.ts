import * as simpleGit from "simple-git/promise";

const {exec} = require('child_process');

async function build() {
  const subFolder = process.argv[2];
  if (!subFolder) {
    throw new Error("missing subfolder");
  }

  const git = simpleGit();

  const branches = await git.branch();
  const currentBranch = branches.current;
  console.log('current branch', currentBranch);

  if (currentBranch !== 'master') {
    console.log('skipping version bump (only master branch)');
    return;
  }


  let lastCommit;
  try {
    lastCommit = await git.log({
        '-1': null,
        file: subFolder+'/'
      }
    );
  } catch (e) {
    throw new Error("invalid path for version bump: "+subFolder);
  }

  const packageJsonCommit = await git.log({
      '-1': null,
      file: subFolder+'/package.json'
    }
  );
  const lastCommitMessage = lastCommit.all[0].message;
  const lastCommitDate = lastCommit.all[0].date;

  const lastUpdateDate = packageJsonCommit.all[0].date;

  const bumpCommitMessage = 'bump version';
  if (lastCommitMessage === bumpCommitMessage) {
    console.log('no version bump for '+ subFolder);
	exec ('echo "##vso[task.setvariable variable=SOURCE_CODE_CHANGED;isOutput=true]false"');
  } else if (lastUpdateDate !== lastCommitDate) {
    console.log('increase Version '+ subFolder);
    exec('cd '+subFolder+' && npm version patch');
	exec ('echo "##vso[task.setvariable variable=SOURCE_CODE_CHANGED;isOutput=true]true"');
  } else {
    console.log('no version bump for '+ subFolder);
	exec ('echo "##vso[task.setvariable variable=SOURCE_CODE_CHANGED;isOutput=true]false"');
  }
}

build();
