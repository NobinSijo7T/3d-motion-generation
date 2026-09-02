from __future__ import annotations

# HumanML3D 22-joint kinematic tree from EricGuo5513/text-to-motion paramUtil.t2m_kinematic_chain
T2M_KINEMATIC_CHAIN = [
    [0, 2, 5, 8, 11],
    [0, 1, 4, 7, 10],
    [0, 3, 6, 9, 12, 15],
    [9, 14, 17, 19, 21],
    [9, 13, 16, 18, 20],
]

PARENTS = [-1, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 12, 13, 14, 16, 17, 18, 19]
JOINT_NAMES = [
    "pelvis",
    "left_hip",
    "right_hip",
    "spine1",
    "left_knee",
    "right_knee",
    "spine2",
    "left_ankle",
    "right_ankle",
    "spine3",
    "left_foot",
    "right_foot",
    "neck",
    "left_collar",
    "right_collar",
    "head",
    "left_shoulder",
    "right_shoulder",
    "left_elbow",
    "right_elbow",
    "left_wrist",
    "right_wrist",
]


def bones(joint_count: int = 22) -> list[list[int]]:
    if joint_count != 22:
        return [[index, index + 1] for index in range(max(0, joint_count - 1))]
    pairs: list[list[int]] = []
    for chain in T2M_KINEMATIC_CHAIN:
        for a, b in zip(chain, chain[1:]):
            pairs.append([a, b])
    return pairs
