import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { useReverseENSLookUp } from '../../utils/ensLookup';
import { containsBlockedText } from '../../utils/moderation/containsBlockedText';
import { useNounSeed } from '../../wrappers/nounToken';
import { BigNumber } from 'ethers';
import { StandaloneNounImage } from '../../components/StandaloneNoun';
import { getNoun } from '../../components/StandaloneNoun';
import classes from './ExploreNounDetail.module.css';
import Image from 'react-bootstrap/Image';
import cx from 'classnames';
import { ImageData } from '@nouns/assets';
import { Trans } from '@lingui/macro';

// import {AnimatePresence, motion} from 'framer-motion/dist/framer-motion';

interface ExploreNounDetailProps {
    nounId: number | undefined;
    handleNounDetail: Function;
}

const ExploreNounDetail: React.FC<ExploreNounDetailProps> = props => {
    // Modified from playground function to remove dashes in filenames
    const parseTraitName = (partName: string): string =>
        capitalizeFirstLetter(partName.substring(partName.indexOf('-') + 1).replace(/-/g, ' '));
    const capitalizeFirstLetter = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

    const traitKeyToLocalizedTraitKeyFirstLetterCapitalized = (s: string): ReactNode => {
        const traitMap = new Map([
          ['background', <Trans>Background</Trans>],
          ['body', <Trans>Body</Trans>],
          ['accessory', <Trans>Accessory</Trans>],
          ['head', <Trans>Head</Trans>],
          ['glasses', <Trans>Glasses</Trans>],
        ]);
        return traitMap.get(s);
      };

    const traitNames = [
      ['cool', 'warm'],
      ...Object.values(ImageData.images).map(i => {
        return i.map(imageData => imageData.filename);
      }),
    ];

    const seed = useNounSeed(BigNumber.from(props.nounId));

    const nounTraits = {
        background: parseTraitName(traitNames[0][seed.background]),
        body: parseTraitName(traitNames[1][seed.body]),
        accessory: parseTraitName(traitNames[2][seed.accessory]),
        head: parseTraitName(traitNames[3][seed.head]),
        glasses: parseTraitName(traitNames[4][seed.glasses]),
    }
    const traitKeys = Object.keys(nounTraits);
    const traitValues = Object.values(nounTraits);

    
    return (
        <div className={classes.sidebar}>
            <button onClick={() => props.handleNounDetail('close')}>close</button>
            <StandaloneNounImage nounId={BigNumber.from(props.nounId)} />
            <p>Noun: {props.nounId}</p>
            <ul>
                {Object.keys(traitValues).map((val,index) => {
                    return (
                        <li>
                            {traitKeyToLocalizedTraitKeyFirstLetterCapitalized(traitKeys[index])}: <Trans>{traitValues[index]}</Trans>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}


export default ExploreNounDetail;
