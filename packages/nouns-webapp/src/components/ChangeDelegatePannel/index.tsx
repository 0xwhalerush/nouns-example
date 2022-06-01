import { Trans } from '@lingui/macro';
import { useEthers } from '@usedapp/core';
import clsx from 'clsx';
import { isAddress } from 'ethers/lib/utils';
import React, { useEffect, useState } from 'react';
import { Collapse, FormControl } from 'react-bootstrap';
import currentDelegatePannelClasses from '../CurrentDelegatePannel/CurrentDelegatePannel.module.css';
import DelegationCandidateInfo from '../DelegationCandidateInfo';
import NavBarButton, { NavBarButtonStyle } from '../NavBarButton';
import classes from './ChangeDelegatePannel.module.css';
import { useDelegateVotes, useNounTokenBalance } from '../../wrappers/nounToken';
import { usePickByState } from '../../utils/pickByState';
import { buildEtherscanTxLink } from '../../utils/etherscan';

interface ChangeDelegatePannelProps {
  onDismiss: () => void;
}

export enum ChangeDelegateState {
  ENTER_DELEGATE_ADDRESS,
  CHANGING,
  CHANGE_SUCCESS,
  CHANGE_FAILURE,
}

/**
 * Gets localized title component based on current ChangeDelegateState
 * @param state
 */
const getTitleFromState = (state: ChangeDelegateState) => {
  switch (state) {
    case ChangeDelegateState.CHANGING:
      return <Trans>Updating...</Trans>;
    case ChangeDelegateState.CHANGE_SUCCESS:
      return <Trans>Delegate Updated!</Trans>;
    case ChangeDelegateState.CHANGE_FAILURE:
      return <Trans>Delegate Update Failed</Trans>;
    default:
      return <Trans>Update Delegate</Trans>;
  }
};

const ChangeDelegatePannel: React.FC<ChangeDelegatePannelProps> = props => {
  const { onDismiss } = props;

  const [changeDelegateState, setChangeDelegateState] = useState<ChangeDelegateState>(
    ChangeDelegateState.ENTER_DELEGATE_ADDRESS,
  );

  const { library, account } = useEthers();

  const [delegateAddress, setDelegateAddress] = useState('');
  const [delegateInputText, setDelegateInputText] = useState('');
  const [delegateInputClass, setDelegateInputClass] = useState<string>('');
  const availableVotes = useNounTokenBalance(account ?? '') ?? 0;
  const { send: delegateVotes, state: delageeState } = useDelegateVotes(delegateAddress);

  useEffect(() => {
    if (delageeState.status === 'Success') {
      setChangeDelegateState(ChangeDelegateState.CHANGE_SUCCESS);
    }

    if (delageeState.status === 'Exception' || delageeState.status === 'Fail') {
      setChangeDelegateState(ChangeDelegateState.CHANGE_FAILURE);
    }

    if (delageeState.status === 'Mining') {
      setChangeDelegateState(ChangeDelegateState.CHANGING);
    }
  }, [delageeState]);

  useEffect(() => {
    const checkIsValidENS = async () => {
      const reverseENSResult = await library?.resolveName(delegateAddress);
      if (reverseENSResult) {
        setDelegateAddress(reverseENSResult);
      }
    };

    checkIsValidENS();
  }, [delegateAddress, library]);

  useEffect(() => {
    if (delegateAddress.length === 0) {
      setDelegateInputClass(classes.empty);
    } else {
      if (isAddress(delegateAddress)) {
        setDelegateInputClass(classes.valid);
      } else {
        setDelegateInputClass(classes.invalid);
      }
    }
  }, [delegateAddress]);

  const etherscanTxLink = buildEtherscanTxLink(delageeState.transaction?.hash ?? '');

  const primaryButton = usePickByState(
    changeDelegateState,
    [
      ChangeDelegateState.ENTER_DELEGATE_ADDRESS,
      ChangeDelegateState.CHANGING,
      ChangeDelegateState.CHANGE_SUCCESS,
      ChangeDelegateState.CHANGE_FAILURE,
    ],
    [
      <NavBarButton
        buttonText={
          <div className={classes.delegateKVotesBtn}>
            Delegate <span className={classes.highlightCircle}>{availableVotes}</span>
            {availableVotes === 1 ? <Trans>Vote</Trans> : <Trans>Votes</Trans>}
          </div>
        }
        buttonStyle={
          isAddress(delegateAddress)
            ? NavBarButtonStyle.DELEGATE_SECONDARY
            : NavBarButtonStyle.DELEGATE_DISABLED
        }
        onClick={() => {
          delegateVotes(delegateAddress);
        }}
        disabled={
          changeDelegateState === ChangeDelegateState.ENTER_DELEGATE_ADDRESS &&
          !isAddress(delegateAddress)
        }
      />,
      <NavBarButton
        buttonText={<Trans>View on Etherscan</Trans>}
        buttonStyle={NavBarButtonStyle.DELEGATE_PRIMARY}
        onClick={() => {
          window.open(etherscanTxLink, '_blank')?.focus();
        }}
        disabled={false}
      />,
      <NavBarButton
        buttonText={<Trans>Close</Trans>}
        buttonStyle={NavBarButtonStyle.DELEGATE_SECONDARY}
        onClick={onDismiss}
      />,
      <></>,
    ],
  );

  const primaryCopy = usePickByState(
    changeDelegateState,
    [
      ChangeDelegateState.ENTER_DELEGATE_ADDRESS,
      ChangeDelegateState.CHANGING,
      ChangeDelegateState.CHANGE_SUCCESS,
      ChangeDelegateState.CHANGE_FAILURE,
    ],
    // eslint-disable-next-line no-sparse-arrays
    [
      <Trans>
        Enter the Ethereum address or ENS name of the account you would like to delegate your votes
        to.
      </Trans>,
      <Trans>
        Your <span style={{ fontWeight: 'bold' }}>{availableVotes}</span> votes are being delegated
        to a new account.
      </Trans>,
      <Trans>
        Your <span style={{ fontWeight: 'bold' }}>{availableVotes}</span> votes have been delegated
        to a new account.
      </Trans>,
      ,
      <>{delageeState.errorMessage}</>,
    ],
  );

  return (
    <>
      <div className={currentDelegatePannelClasses.wrapper}>
        <h1 className={currentDelegatePannelClasses.title}>
          {getTitleFromState(changeDelegateState)}
        </h1>
        <p className={currentDelegatePannelClasses.copy}>{primaryCopy}</p>
      </div>

      {!(changeDelegateState === ChangeDelegateState.CHANGE_FAILURE) && (
        <FormControl
          className={clsx(classes.delegateInput, delegateInputClass)}
          type="string"
          onChange={e => {
            setDelegateAddress(e.target.value);
            setDelegateInputText(e.target.value);
          }}
          value={delegateInputText}
          placeholder={'0x... or ...eth'}
        />
      )}

      <Collapse
        in={
          isAddress(delegateAddress) &&
          !(changeDelegateState === ChangeDelegateState.CHANGE_FAILURE)
        }
      >
        <div className={classes.delegateCandidateInfoWrapper}>
          {isAddress(delegateAddress) && (
            <DelegationCandidateInfo
              address={delegateAddress || ''}
              votesToAdd={availableVotes}
              changeModalState={changeDelegateState}
            />
          )}
        </div>
      </Collapse>

      <div className={classes.buttonWrapper}>
        <NavBarButton
          buttonText={
            changeDelegateState === ChangeDelegateState.CHANGE_SUCCESS ? (
              <Trans>Change</Trans>
            ) : (
              <Trans>Close</Trans>
            )
          }
          buttonStyle={NavBarButtonStyle.DELEGATE_BACK}
          onClick={
            changeDelegateState === ChangeDelegateState.CHANGE_SUCCESS
              ? () => {
                  setDelegateAddress('');
                  setDelegateInputText('');
                  setChangeDelegateState(ChangeDelegateState.ENTER_DELEGATE_ADDRESS);
                }
              : onDismiss
          }
        />
        {changeDelegateState === ChangeDelegateState.ENTER_DELEGATE_ADDRESS && (
          <div
            className={clsx(
              classes.customButtonHighlighter,
              isAddress(delegateAddress) && classes.extened,
            )}
          />
        )}
        {primaryButton}
      </div>
    </>
  );
};

export default ChangeDelegatePannel;
